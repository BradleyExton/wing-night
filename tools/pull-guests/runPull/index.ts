// The pack pull end to end: read the pack, ask the portal, plan, fetch and check every head, then
// back up and write. Everything outside — the pack's root, the network, the clock, the log — comes
// in as an argument, so the tests drive it with a temp pack and a fake portal.
//
// All or nothing, as far as the filesystem allows: every head is downloaded and its hash checked
// BEFORE the first byte is written, the roster and manifest are backed up beside themselves, and
// each file lands by an atomic rename. The pack is not a git repo, so a bad write has no undo but
// the backup.
import { createHash } from "node:crypto";
import { constants, copyFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { writeFileAtomically } from "../../../apps/server/src/writeFileAtomically/index.ts";
import {
  isAdminGuestExportList,
  type AdminGuestExport
} from "../../../packages/shared/src/guestPortal/export/index.ts";
import {
  PORTAL_API_ROUTES,
  resolveAdminGuestAvatarRoute
} from "../../../packages/shared/src/guestPortal/routes/index.ts";
import {
  AVATAR_FILE_DIR,
  MANIFEST_FILE,
  PLAYERS_FILE,
  describePlan,
  listPlannedWrites,
  planPull,
  readAvatarManifest,
  readPlayersFile,
  type PullPlan
} from "../planPull/index.ts";

export const DEFAULT_PORTAL_ORIGIN = "https://wingnight.tv";
// The Worker's ADMIN_API_TOKEN, kept in the pack's .env beside GEMINI_API_KEY.
export const ADMIN_TOKEN_ENV_KEY = "WINGNIGHT_ADMIN_API_TOKEN";

export type PullOptions = {
  contentRootDir: string;
  origin: string;
  token: string;
  dryRun: boolean;
  fetch: typeof fetch;
  now: () => Date;
  log: (line: string) => void;
};

// The token is a bearer: it may only travel encrypted, or to this machine.
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const resolvePortalOrigin = (origin: string): string => {
  let url: URL;

  try {
    url = new URL(origin);
  } catch {
    throw new Error(`--origin ${origin} is not a URL.`);
  }

  if (url.protocol !== "https:" && !(url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname))) {
    throw new Error(`--origin ${origin} must be https (or http to this machine): the admin token rides on it.`);
  }

  return url.origin;
};

const readJsonFile = (filePath: string): unknown => {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    throw new Error(`${filePath} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const portalGet = async (options: PullOptions, origin: string, route: string): Promise<Response> => {
  const response = await options.fetch(`${origin}${route}`, {
    headers: { Authorization: `Bearer ${options.token}` },
    // Not followed: a redirect would carry the bearer somewhere this run never named.
    redirect: "manual"
  });

  if (response.status >= 300 && response.status < 400) {
    throw new Error(
      `${origin}${route} redirected (${response.status} to ${response.headers.get("Location") ?? "nowhere named"}); the pull refuses redirects so the admin token only goes to --origin. Pass the final origin as --origin.`
    );
  }

  if (!response.ok) {
    // Redacted: whatever the server says back is printed, and it may echo the request.
    const detail = (await response.text().catch(() => "")).split(options.token).join("[token]");

    throw new Error(
      `${origin}${route} answered ${response.status} ${detail.slice(0, 200)}`.trim() +
        (response.status === 403 ? ` — is ${ADMIN_TOKEN_ENV_KEY} the Worker's ADMIN_API_TOKEN?` : "")
    );
  }

  return response;
};

const fetchGuests = async (options: PullOptions, origin: string): Promise<AdminGuestExport[]> => {
  const body = (await (await portalGet(options, origin, PORTAL_API_ROUTES.adminExport)).json()) as unknown;

  if (!isAdminGuestExportList(body)) {
    throw new Error(`${origin}${PORTAL_API_ROUTES.adminExport} did not answer with a guest export.`);
  }

  return body;
};

// Every head, checked against the hash the export promised, before anything is written.
const downloadHeads = async (options: PullOptions, origin: string, plan: PullPlan): Promise<Map<string, Uint8Array>> => {
  const bytesByFile = new Map<string, Uint8Array>();

  for (const download of plan.downloads) {
    const response = await portalGet(options, origin, resolveAdminGuestAvatarRoute(download.guestId));
    const bytes = new Uint8Array(await response.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");

    if (sha256 !== download.sha256) {
      throw new Error(
        `${download.name}'s head did not match its hash (expected ${download.sha256}, got ${sha256}); nothing written.`
      );
    }

    bytesByFile.set(download.file, bytes);
  }

  return bytesByFile;
};

// Each file lands whole, but the set does not: a failure part way leaves some written. Every
// write is one a rerun makes again (same heads, same manifest, same roster), so a rerun repairs it.
const describeWriteFailure = ({
  filePath,
  error,
  written,
  total,
  backups
}: {
  filePath: string;
  error: unknown;
  written: number;
  total: number;
  backups: string[];
}): string => {
  const reason = error instanceof Error ? error.message : String(error);
  const state =
    written === 0
      ? "Nothing in the pack was changed except the backups."
      : `The pack is HALF-WRITTEN: ${written} of ${total} files landed before this one.`;
  const backupLine = backups.length === 0 ? "No backups were needed." : `Backups: ${backups.join(", ")}.`;

  return `Writing ${filePath} failed: ${reason}\n${state}\n${backupLine}\nFix the cause and run pnpm pack:pull again: it rewrites whatever is missing.`;
};

const toBackupStamp = (date: Date): string => date.toISOString().replace(/[:.]/g, "-");

const formatJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const runPull = async (options: PullOptions): Promise<PullPlan> => {
  const origin = resolvePortalOrigin(options.origin);
  const playersPath = join(options.contentRootDir, PLAYERS_FILE);
  const manifestPath = join(options.contentRootDir, MANIFEST_FILE);

  options.log(`Content pack: ${options.contentRootDir}`);

  // A pack without a roster yet starts from an empty one, never the sample's made-up players.
  const playersFile = existsSync(playersPath)
    ? readPlayersFile(readJsonFile(playersPath), playersPath)
    : { players: [] };
  const manifest = existsSync(manifestPath)
    ? readAvatarManifest(readJsonFile(manifestPath), manifestPath)
    : { generated: {} };
  const guests = await fetchGuests(options, origin);

  options.log(`Portal: ${origin} (${guests.length} guests, ${guests.filter((guest) => guest.head !== null).length} with heads)`);

  const plan = planPull({
    playersFile,
    manifest,
    guests,
    headFileExists: (file) => existsSync(join(options.contentRootDir, AVATAR_FILE_DIR, file)),
    now: options.now()
  });

  describePlan(plan).forEach((line) => options.log(line));

  const writes = listPlannedWrites(plan);

  if (options.dryRun) {
    options.log("Dry run: nothing written.");
    return plan;
  }

  if (writes.length === 0) {
    return plan;
  }

  const heads = await downloadHeads(options, origin, plan);
  const stamp = toBackupStamp(options.now());
  const backups: string[] = [];

  for (const [filePath, changed] of [
    [playersPath, plan.playersChanged],
    [manifestPath, plan.manifestChanged]
  ] as const) {
    if (changed && existsSync(filePath)) {
      // EXCL: a backup is never overwritten, even by a second run in the same millisecond.
      copyFileSync(filePath, `${filePath}.${stamp}.bak`, constants.COPYFILE_EXCL);
      backups.push(`${filePath}.${stamp}.bak`);
      options.log(`Backed up ${filePath}.${stamp}.bak`);
    }
  }

  // Heads first, then the manifest, then the roster: the roster never points at a missing file.
  const fileWrites = [...heads].map(([file, bytes]): [string, string | Uint8Array] => [
    join(options.contentRootDir, AVATAR_FILE_DIR, file),
    bytes
  ]);

  if (plan.manifestChanged) {
    fileWrites.push([manifestPath, formatJson(plan.manifest)]);
  }

  if (plan.playersChanged) {
    fileWrites.push([playersPath, formatJson(plan.players)]);
  }

  fileWrites.forEach(([filePath, contents], index) => {
    try {
      writeFileAtomically(filePath, contents);
    } catch (error) {
      throw new Error(describeWriteFailure({ filePath, error, written: index, total: fileWrites.length, backups }));
    }
  });

  options.log(`Wrote ${writes.length} files. Restart the server to load the updated roster.`);

  return plan;
};
