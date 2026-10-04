// Seeds Brad's admin row and prints his personal link, once:
//   pnpm --filter @wingnight/teaser-worker seed:admin --name Brad --email you@example.com --local
//
// `--local` writes to wrangler dev's local D1 (applying the migrations first) and prints the link
// on the teaser's Vite origin (http://localhost:5173, run `pnpm teaser:dev`); `--remote` writes
// to the real wingnight-portal database, whose migrations `pnpm teaser:deploy` applies. Running it
// again for the same address mints a fresh link and revokes the old one.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

import { buildSeedAdminSql, parseSeedAdminArgs } from "../src/seedAdmin/index.ts";
import { resolveSignInUrl } from "../src/signInLinks/index.ts";
import { hashToken, mintGuestId, mintToken } from "../src/tokens/index.ts";

const DATABASE_NAME = "wingnight-portal";
const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));

const runWrangler = (args: string[]): void => {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], { cwd: PACKAGE_DIR, stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const args = parseSeedAdminArgs(process.argv.slice(2));

if ("error" in args) {
  console.error(args.error);
  process.exit(1);
}

const random = (byteCount: number): Uint8Array => new Uint8Array(randomBytes(byteCount));
const token = mintToken(random);
const sql = buildSeedAdminSql({
  guestId: mintGuestId(random),
  displayName: args.displayName,
  email: args.email,
  tokenHash: await hashToken(token),
  now: Date.now()
});

if (args.target === "local") {
  runWrangler(["d1", "migrations", "apply", DATABASE_NAME, "--local"]);
}

runWrangler(["d1", "execute", DATABASE_NAME, `--${args.target}`, "--command", sql]);

process.stdout.write(`\n${args.displayName}'s personal sign-in link (shown once, keep it):\n${resolveSignInUrl(args.origin, token)}\n`);
