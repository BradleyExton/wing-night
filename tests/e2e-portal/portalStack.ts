// Where the portal's Playwright stack lives, worked out once for the config (which boots it) and
// the specs (which read the links it seeded). Ports are env-overridable like the main suite's, so
// a gate run can pin its own and never reuse a `pnpm teaser:dev` on 8787/5173.
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolvePort } from "../../tools/playwright-ports/index.mjs";

export type PortalStack = {
  workerPort: number;
  clientPort: number;
  clientOrigin: string;
  // The throwaway local D1/R2 the stack seeds; its own per worker port, so two runs on different
  // ports never share one, and never the developer's apps/teaser-worker/.wrangler/state.
  stateDir: string;
};

export const resolvePortalStack = (env: Record<string, string | undefined>): PortalStack => {
  const workerPort = resolvePort(env, "WN_E2E_PORTAL_WORKER_PORT", 8787);
  const clientPort = resolvePort(env, "WN_E2E_PORTAL_CLIENT_PORT", 5173);

  return {
    workerPort,
    clientPort,
    clientOrigin: `http://localhost:${clientPort}`,
    stateDir: join(tmpdir(), `wingnight-e2e-portal-${workerPort}`)
  };
};

export type SeededLinks = {
  admin: string;
  guest: string;
  guestWithoutEmail: string;
};

// The personal links apps/teaser-worker/scripts/e2ePortalStack.ts minted, as paths on the page's
// origin (`/s/<token>`).
export const readSeededLinks = (): SeededLinks => {
  const { stateDir } = resolvePortalStack(process.env);
  const links = JSON.parse(readFileSync(join(stateDir, "links.json"), "utf8")) as SeededLinks;
  const toPath = (url: string): string => new URL(url).pathname;

  return { admin: toPath(links.admin), guest: toPath(links.guest), guestWithoutEmail: toPath(links.guestWithoutEmail) };
};

// Where a spec saves the screenshots a person looks at: WN_E2E_PORTAL_SCREENSHOT_DIR when set,
// else the test's own output folder.
export const resolveScreenshotPath = (fallbackDir: string, fileName: string): string =>
  join(process.env.WN_E2E_PORTAL_SCREENSHOT_DIR ?? fallbackDir, fileName);
