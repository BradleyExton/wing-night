// The pure half of the pack pull: given the pack's roster and avatar manifest as they are on disk
// and the portal's export, what the pack should become. No network, no filesystem — runPull does
// both — so every rule about whose name and whose head lands where is tested here.
//
// The roster is matched, never rewritten. Minigame prompts find their featured players BY NAME,
// so a renamed player silently loses every prompt written about them: a matched player keeps their
// name, team and anything else they carry, and nobody is ever removed. A guest is matched first by
// their portal id — remembered in the manifest from the last pull, so a guest renamed on the
// portal still lands on the same player — and otherwise by name slug (slugifyName, accents
// folded). A guest neither finds is added under their portal name, unseated.
import { slugifyName } from "../../../packages/avatar-head/src/index.ts";
import type { AdminGuestExport } from "../../../packages/shared/src/guestPortal/export/index.ts";

// Where a head's file goes, pack-relative: `avatarSrc` names it from the assets root
// (`avatars/<file>`, no leading slash, as `pnpm import:avatars` writes it), and the file itself
// lives under local/assets/.
export const AVATAR_ASSET_DIR = "avatars";
export const PLAYERS_FILE = "local/players.json";
export const MANIFEST_FILE = "local/avatar-sources/manifest.json";
export const AVATAR_FILE_DIR = `local/assets/${AVATAR_ASSET_DIR}`;
// The only head type the portal keeps (AVATAR_HEAD_TYPE), and the extension the file gets.
const HEAD_CONTENT_TYPE = "image/png";
// Enough of the hash that a changed head gets a new file name, so the TV's cache of the old one
// can never show through.
const HEAD_HASH_PREFIX_LENGTH = 8;

// The pack's files as JSON hands them back. Anything a player or the manifest carries beyond
// what the pull reads is kept untouched — players.json is never round-tripped through the server's
// content reader, which rebuilds entries and would drop it.
export type PlayerRecord = Record<string, unknown> & { name: string };
export type PlayersFile = Record<string, unknown> & { players: PlayerRecord[] };
// `generated` is `pnpm import:avatars`'s, keyed by player slug. `onlineGuests` is the pull's own:
// portal guest id -> the slug of the player that guest became. Both stay inside the pack's
// avatar-sources; players.json never carries a guest id.
export type AvatarManifest = Record<string, unknown> & {
  generated: Record<string, unknown>;
  onlineGuests?: Record<string, string>;
};

// How a pulled head is recorded in `pnpm import:avatars`'s manifest, so that tool leaves it be.
export type OnlineManifestEntry = {
  file: string;
  source: "online";
  at: string;
  sha256: string;
  guestId: string;
};

export type HeadDownload = {
  guestId: string;
  name: string;
  file: string;
  sha256: string;
  bytes: number;
};

export type AvatarChange = {
  name: string;
  from: string | null;
  to: string;
};

// A guest whose portal name no longer matches their player's: the player keeps theirs.
export type NameNote = {
  name: string;
  portalName: string;
};

export type PullPlan = {
  players: PlayersFile;
  manifest: AvatarManifest;
  addedPlayers: string[];
  avatarChanges: AvatarChange[];
  nameNotes: NameNote[];
  downloads: HeadDownload[];
  playersChanged: boolean;
  manifestChanged: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPlayerRecord = (value: unknown): value is PlayerRecord =>
  isRecord(value) && typeof value.name === "string" && value.name.trim().length > 0;

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");

export const readPlayersFile = (value: unknown, filePath: string): PlayersFile => {
  if (!isRecord(value) || !Array.isArray(value.players) || !value.players.every(isPlayerRecord)) {
    throw new Error(`${filePath} is not a roster (a "players" list of entries with a "name"); fix it before pulling.`);
  }

  return { ...value, players: value.players };
};

export const readAvatarManifest = (value: unknown, filePath: string): AvatarManifest => {
  if (
    !isRecord(value) ||
    (value.generated !== undefined && !isRecord(value.generated)) ||
    (value.onlineGuests !== undefined && !isStringRecord(value.onlineGuests))
  ) {
    throw new Error(`${filePath} is not an avatar manifest (a "generated" map); fix it before pulling.`);
  }

  return {
    ...value,
    generated: value.generated ?? {},
    ...(value.onlineGuests === undefined ? {} : { onlineGuests: value.onlineGuests })
  };
};

export const resolveHeadFileName = (slug: string, sha256: string): string =>
  `${slug}-${sha256.slice(0, HEAD_HASH_PREFIX_LENGTH)}.png`;

const quoteNames = (names: string[]): string => names.map((name) => `"${name}"`).join(", ");

// The player each guest becomes: an index into the roster, or null for a new player.
type GuestMatch = { guest: AdminGuestExport; index: number | null };

// Matches every guest, or throws with every reason it cannot do so safely, all at once, so one
// run lists them all. The advice never says to rename a player: prompts find players by name.
const matchGuests = (
  guests: AdminGuestExport[],
  players: PlayerRecord[],
  onlineGuests: Record<string, string>
): GuestMatch[] => {
  const problems: string[] = [];
  const matches: GuestMatch[] = [];
  const playerIndexesBySlug = new Map<string, number[]>();
  const guestsByPlayer = new Map<number, AdminGuestExport[]>();
  const newGuestsBySlug = new Map<string, AdminGuestExport[]>();

  players.forEach((player, index) => {
    const slug = slugifyName(player.name);

    playerIndexesBySlug.set(slug, [...(playerIndexesBySlug.get(slug) ?? []), index]);
  });

  for (const guest of guests) {
    if (guest.head !== null && guest.head.contentType !== HEAD_CONTENT_TYPE) {
      problems.push(`Guest "${guest.displayName}" has a ${guest.head.contentType} head; only ${HEAD_CONTENT_TYPE} is pulled.`);
    }

    const pulledBefore = onlineGuests[guest.guestId];
    const byId = pulledBefore === undefined ? [] : (playerIndexesBySlug.get(pulledBefore) ?? []);
    const slug = slugifyName(guest.displayName);
    const bySlug = playerIndexesBySlug.get(slug) ?? [];

    if (byId.length === 1) {
      matches.push({ guest, index: byId[0] as number });
    } else if (slug.length === 0) {
      problems.push(
        `Guest "${guest.displayName}" (${guest.guestId}) has no letters or digits to match a player by; give them a name with some on wingnight.tv.`
      );
      continue;
    } else if (bySlug.length > 1) {
      problems.push(
        `Guest "${guest.displayName}" matches players ${quoteNames(bySlug.map((index) => (players[index] as PlayerRecord).name))}, which the pull cannot tell apart. Rename the guest on wingnight.tv to match neither — or, only if no minigame prompt names them (prompts find players by name), one of those players in players.json.`
      );
      continue;
    } else if (bySlug.length === 1) {
      matches.push({ guest, index: bySlug[0] as number });
    } else {
      newGuestsBySlug.set(slug, [...(newGuestsBySlug.get(slug) ?? []), guest]);
      matches.push({ guest, index: null });
      continue;
    }

    const index = matches.at(-1)?.index as number;

    guestsByPlayer.set(index, [...(guestsByPlayer.get(index) ?? []), guest]);
  }

  for (const [index, sameGuests] of guestsByPlayer) {
    if (sameGuests.length > 1) {
      problems.push(
        `Guests ${quoteNames(sameGuests.map((guest) => guest.displayName))} all match the player "${(players[index] as PlayerRecord).name}"; rename the ones who are not them on wingnight.tv (a portal name never renames a player).`
      );
    }
  }

  for (const [slug, sameGuests] of newGuestsBySlug) {
    if (sameGuests.length > 1) {
      problems.push(
        `Guests ${quoteNames(sameGuests.map((guest) => guest.displayName))} would all be the new player "${slug}"; rename all but one on wingnight.tv.`
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(["Pull refused, nothing written:", ...problems.map((problem) => `  - ${problem}`)].join("\n"));
  }

  return matches;
};

export const planPull = ({
  playersFile,
  manifest,
  guests,
  headFileExists,
  now
}: {
  playersFile: PlayersFile;
  manifest: AvatarManifest;
  guests: AdminGuestExport[];
  // Whether local/assets/avatars/<file> is already on disk.
  headFileExists: (file: string) => boolean;
  now: Date;
}): PullPlan => {
  const onlineGuests = { ...(manifest.onlineGuests ?? {}) };
  const matches = matchGuests(guests, playersFile.players, onlineGuests);
  const players = [...playersFile.players];
  const generated = { ...manifest.generated };
  const addedPlayers: string[] = [];
  const avatarChanges: AvatarChange[] = [];
  const nameNotes: NameNote[] = [];
  const downloads: HeadDownload[] = [];
  let playersChanged = false;
  let manifestChanged = false;

  for (const { guest, index: matchedIndex } of matches) {
    let index = matchedIndex;

    if (index === null) {
      players.push({ name: guest.displayName });
      addedPlayers.push(guest.displayName);
      playersChanged = true;
      index = players.length - 1;
    }

    const player = players[index] as PlayerRecord;
    // The player's own slug, never the portal name's: it is `pnpm import:avatars`'s key too.
    const slug = slugifyName(player.name);

    if (slugifyName(guest.displayName) !== slug) {
      nameNotes.push({ name: player.name, portalName: guest.displayName });
    }

    if (onlineGuests[guest.guestId] !== slug) {
      onlineGuests[guest.guestId] = slug;
      manifestChanged = true;
    }

    // No head online leaves whatever head the player already has.
    if (guest.head === null) {
      continue;
    }

    const file = resolveHeadFileName(slug, guest.head.sha256);
    const avatarSrc = `${AVATAR_ASSET_DIR}/${file}`;
    const recorded = generated[slug];
    const alreadyPulled =
      isRecord(recorded) &&
      recorded.source === "online" &&
      recorded.sha256 === guest.head.sha256 &&
      recorded.file === file &&
      recorded.guestId === guest.guestId &&
      headFileExists(file);

    if (!alreadyPulled) {
      if (!headFileExists(file)) {
        downloads.push({ guestId: guest.guestId, name: player.name, file, sha256: guest.head.sha256, bytes: guest.head.bytes });
      }

      generated[slug] = {
        file,
        source: "online",
        at: now.toISOString(),
        sha256: guest.head.sha256,
        guestId: guest.guestId
      } satisfies OnlineManifestEntry;
      manifestChanged = true;
    }

    if (player.avatarSrc !== avatarSrc) {
      avatarChanges.push({ name: player.name, from: typeof player.avatarSrc === "string" ? player.avatarSrc : null, to: avatarSrc });
      players[index] = { ...player, avatarSrc };
      playersChanged = true;
    }
  }

  return {
    players: { ...playersFile, players },
    manifest: { ...manifest, generated, onlineGuests },
    addedPlayers,
    avatarChanges,
    nameNotes,
    downloads,
    playersChanged,
    manifestChanged
  };
};

// Pack-relative paths, in the order runPull writes them: the heads first, so the roster never
// points at a file that is not there yet.
export const listPlannedWrites = (plan: PullPlan): string[] => [
  ...plan.downloads.map((download) => `${AVATAR_FILE_DIR}/${download.file}`),
  ...(plan.manifestChanged ? [MANIFEST_FILE] : []),
  ...(plan.playersChanged ? [PLAYERS_FILE] : [])
];

// The diff a dry run prints, and a real run prints before it writes.
export const describePlan = (plan: PullPlan): string[] => {
  const writes = listPlannedWrites(plan);
  const notes = plan.nameNotes.map(
    (note) => `Note: portal name is now "${note.portalName}"; player keeps "${note.name}".`
  );

  if (writes.length === 0) {
    return [...notes, "Nothing to pull: the pack already has every guest and every head."];
  }

  const sizeByWrite = new Map(
    plan.downloads.map((download) => [`${AVATAR_FILE_DIR}/${download.file}`, ` (${download.bytes} bytes)`])
  );

  return [
    ...notes,
    `Players to add (${plan.addedPlayers.length}):`,
    ...plan.addedPlayers.map((name) => `  + ${name}`),
    `Avatar changes (${plan.avatarChanges.length}):`,
    ...plan.avatarChanges.map((change) => `  ${change.name}: ${change.from ?? "(none)"} -> ${change.to}`),
    `Files to write (${writes.length}):`,
    ...writes.map((write) => `  ${write}${sizeByWrite.get(write) ?? ""}`)
  ];
};
