// The Worker half of the portal's Playwright run (playwright.portal.config.ts starts it):
//   pnpm --filter @wingnight/teaser-worker e2e:portal-stack
//
// A fresh local D1 and R2 in a throwaway directory the config names — never this package's
// `.wrangler/state`, which is the developer's own `teaser:dev` data — seeded with an admin (Brad),
// a guest with an address (Rob) and one without (Sam). Rob's and Brad's personal links are written
// to `links.json` there for the specs to read. Then `wrangler dev` on that state, with mail logged
// and the fake painter, until Playwright stops it.
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSeedAdminSql } from "../src/seedAdmin/index.ts";
import { resolveSignInUrl } from "../src/signInLinks/index.ts";
import { hashToken, mintGuestId, mintToken } from "../src/tokens/index.ts";

const DATABASE_NAME = "wingnight-portal";
const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));

const readEnv = (name: string): string => {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    console.error(`e2e:portal-stack needs ${name} (playwright.portal.config.ts sets it).`);
    process.exit(1);
  }

  return value;
};

const stateDir = readEnv("WN_E2E_PORTAL_STATE_DIR");
const workerPort = readEnv("WN_E2E_PORTAL_WORKER_PORT");
const clientOrigin = readEnv("WN_E2E_PORTAL_CLIENT_ORIGIN");
// Optional: opens the admin API to a bearer, for driving `pnpm pack:pull` against this stack.
const adminApiToken = process.env.WN_E2E_PORTAL_ADMIN_API_TOKEN ?? "";

const runWrangler = (args: string[]): void => {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], { cwd: PACKAGE_DIR, stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`;
const random = (byteCount: number): Uint8Array => new Uint8Array(randomBytes(byteCount));

type SeededGuest = { guestId: string; token: string };

const seedGuestSql = async (displayName: string, email: string | null, now: number): Promise<[string, SeededGuest]> => {
  const guest = { guestId: mintGuestId(random), token: mintToken(random) };
  // A guest with an address was emailed their invite; one without is texted, so never "invited".
  const sql = [
    `INSERT INTO guests (guest_id, display_name, email, is_admin, created_at, invited_at)
     VALUES (${quote(guest.guestId)}, ${quote(displayName)}, ${email === null ? "NULL" : quote(email)}, 0, ${now},
       ${email === null ? "NULL" : now})`,
    `INSERT INTO personal_links (token_hash, guest_id, created_at)
     VALUES (${quote(await hashToken(guest.token))}, ${quote(guest.guestId)}, ${now})`
  ].join(";\n");

  return [sql, guest];
};

rmSync(stateDir, { recursive: true, force: true });
mkdirSync(stateDir, { recursive: true });
// wrangler dev refuses to boot without its assets directory; Vite serves the pages here.
mkdirSync(join(PACKAGE_DIR, "../client/dist-teaser"), { recursive: true });

runWrangler(["d1", "migrations", "apply", DATABASE_NAME, "--local", "--persist-to", stateDir]);

const now = Date.now();
const adminToken = mintToken(random);
const adminSql = buildSeedAdminSql({
  guestId: mintGuestId(random),
  displayName: "Brad",
  email: "brad@example.test",
  tokenHash: await hashToken(adminToken),
  now
});
const [robSql, rob] = await seedGuestSql("Rob", "rob@example.test", now);
const [samSql, sam] = await seedGuestSql("Sam", null, now);

runWrangler([
  "d1",
  "execute",
  DATABASE_NAME,
  "--local",
  "--persist-to",
  stateDir,
  "--command",
  [adminSql, robSql, samSql].join(";\n")
]);

writeFileSync(
  join(stateDir, "links.json"),
  JSON.stringify({
    admin: resolveSignInUrl(clientOrigin, adminToken),
    guest: resolveSignInUrl(clientOrigin, rob.token),
    guestWithoutEmail: resolveSignInUrl(clientOrigin, sam.token)
  })
);

const wrangler = spawn(
  "pnpm",
  [
    "exec",
    "wrangler",
    "dev",
    "--ip",
    "127.0.0.1",
    "--port",
    workerPort,
    "--persist-to",
    stateDir,
    "--show-interactive-dev-session=false",
    "--var",
    "MAIL_TRANSPORT:log",
    "--var",
    "GEMINI_TRANSPORT:fake",
    "--var",
    `PUBLIC_ORIGIN:${clientOrigin}`,
    ...(adminApiToken.length > 0 ? ["--var", `ADMIN_API_TOKEN:${adminApiToken}`] : [])
  ],
  { cwd: PACKAGE_DIR, stdio: "inherit" }
);

// wrangler shuts workerd down cleanly on SIGINT; whatever stops this script, it gets that.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    wrangler.kill("SIGINT");
  });
}

wrangler.on("exit", (code) => {
  process.exit(code ?? 0);
});
