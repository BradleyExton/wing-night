#!/usr/bin/env node
// Copies the guests and their kept heads from wingnight.tv into the night pack, before the party:
//   pnpm pack:pull [--dry-run] [--origin https://wingnight.tv]
//
// One-way and offline-safe: the party never talks to the portal, so whatever the pack holds after
// this run is what the night has. Each guest becomes a player (matched to an existing one by the
// portal id an earlier pull remembered, else by name slug; added unseated otherwise; never renamed
// or removed); each kept head lands at
// local/assets/avatars/<slug>-<hash>.png with the player's avatarSrc pointed at it, and is
// recorded in `pnpm import:avatars`'s manifest as an online head that tool leaves alone. Votes
// and teammate wishes never come down — the export does not carry them.
//
// Needs WINGNIGHT_ADMIN_API_TOKEN, the Worker's ADMIN_API_TOKEN, which lives in the pack's .env
// beside GEMINI_API_KEY (an exported one in the shell wins). WN_CONTENT_ROOT_DIR points the run
// at another pack, as it does for the server and the other pack tools. `--dry-run` prints what
// would change and writes nothing at all.
//
// Plain `node`, like the other pack tools: everything it imports — the content root resolver,
// the atomic writer, the portal's routes and export contract, slugifyName — is importable with
// type stripping alone.
import { existsSync } from "node:fs";
import { join } from "node:path";

import { resolveContentRootDir } from "../../apps/server/src/contentLoader/contentLoaderUtils/index.ts";
import { ADMIN_TOKEN_ENV_KEY, DEFAULT_PORTAL_ORIGIN, runPull } from "./runPull/index.ts";

const parseArgs = (argv: string[]): { dryRun: boolean; origin: string } => {
  const args = { dryRun: false, origin: DEFAULT_PORTAL_ORIGIN };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--origin" && argv[index + 1] !== undefined) {
      index += 1;
      args.origin = argv[index] as string;
    } else {
      throw new Error(`Unknown argument: ${arg}. Usage: pnpm pack:pull [--dry-run] [--origin <url>]`);
    }
  }

  return args;
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const contentRootDir = resolveContentRootDir();
  const packEnvPath = join(contentRootDir, ".env");

  if (!process.env[ADMIN_TOKEN_ENV_KEY] && existsSync(packEnvPath)) {
    process.loadEnvFile(packEnvPath);
  }

  const token = process.env[ADMIN_TOKEN_ENV_KEY];

  if (!token) {
    throw new Error(`${ADMIN_TOKEN_ENV_KEY} is not set. Put the Worker's ADMIN_API_TOKEN in ${packEnvPath}.`);
  }

  await runPull({
    contentRootDir,
    origin: args.origin,
    token,
    dryRun: args.dryRun,
    fetch,
    now: () => new Date(),
    log: (line) => process.stdout.write(`${line}\n`)
  });
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
