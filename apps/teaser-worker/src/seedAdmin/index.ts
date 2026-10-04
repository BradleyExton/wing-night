// The first admin row, for scripts/seedAdmin.ts: Brad is a guest like any other, with is_admin
// set, and his way in is a personal link like anyone's. Seeding again for the same address keeps
// the guest (and their id), makes sure they are an admin, and mints them a fresh link.
import { normalizeGuestDisplayName, normalizeGuestEmail } from "@wingnight/shared/guestPortal";

export type SeedTarget = "local" | "remote";

export type SeedAdminArgs = {
  displayName: string;
  email: string;
  target: SeedTarget;
  origin: string;
};

const DEFAULT_ORIGINS: Record<SeedTarget, string> = {
  // The teaser's Vite port in `pnpm teaser:dev` (strict, so it never drifts): the page a link
  // signs in to is there, and Vite forwards /s/ to wrangler dev.
  local: "http://localhost:5173",
  remote: "https://wingnight.tv"
};

const readFlag = (argv: readonly string[], flag: string): string | null => {
  const index = argv.indexOf(flag);

  return index === -1 ? null : (argv[index + 1] ?? null);
};

// `--name <name> --email <address> (--local | --remote) [--origin <url>]`, or an error to print.
export const parseSeedAdminArgs = (argv: readonly string[]): SeedAdminArgs | { error: string } => {
  const displayName = normalizeGuestDisplayName(readFlag(argv, "--name"));
  const email = normalizeGuestEmail(readFlag(argv, "--email"));
  const isLocal = argv.includes("--local");
  const isRemote = argv.includes("--remote");

  if (displayName === null || email === null || isLocal === isRemote) {
    return { error: "Usage: seed:admin --name <name> --email <address> (--local | --remote) [--origin <url>]" };
  }

  const target: SeedTarget = isLocal ? "local" : "remote";

  return { displayName, email, target, origin: readFlag(argv, "--origin") ?? DEFAULT_ORIGINS[target] };
};

const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`;

type SeedAdminRow = {
  guestId: string;
  displayName: string;
  email: string;
  tokenHash: string;
  now: number;
};

// One `wrangler d1 execute --command` worth of SQL. Every value is quoted here because the
// command line has no bind parameters; the name and address have been normalized already.
export const buildSeedAdminSql = ({ guestId, displayName, email, tokenHash, now }: SeedAdminRow): string => {
  const guestByEmail = `(SELECT guest_id FROM guests WHERE email = ${quote(email)})`;

  return [
    // Stamped as invited: printing the link IS Brad's invite, so "invite everyone" leaves him be.
    `INSERT INTO guests (guest_id, display_name, email, is_admin, created_at, invited_at)
     VALUES (${quote(guestId)}, ${quote(displayName)}, ${quote(email)}, 1, ${now}, ${now})
     ON CONFLICT (email) DO UPDATE SET is_admin = 1, display_name = excluded.display_name,
       invited_at = COALESCE(guests.invited_at, excluded.invited_at)`,
    `UPDATE personal_links SET revoked_at = ${now} WHERE guest_id = ${guestByEmail} AND revoked_at IS NULL`,
    `INSERT INTO personal_links (token_hash, guest_id, created_at)
     SELECT ${quote(tokenHash)}, guest_id, ${now} FROM guests WHERE email = ${quote(email)}`
  ].join(";\n");
};
