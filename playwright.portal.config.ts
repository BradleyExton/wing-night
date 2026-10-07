import { defineConfig, devices } from "@playwright/test";

import { resolvePortalStack } from "./tests/e2e-portal/portalStack.ts";

// The guest portal end to end (`pnpm test:e2e:portal`): wrangler dev on a fresh, seeded local
// D1/R2 with mail logged and the fake painter, and the teaser's Vite server in front of it
// forwarding /api and /s as it does in `pnpm teaser:dev`. A separate config from the party's
// (playwright.config.ts) because it is a separate stack: no party server, no content pack.
// Ports as the main suite: env-pinned in the verify command (CLAUDE.md), `CI=1` to never reuse.
const stack = resolvePortalStack(process.env);

export default defineConfig({
  testDir: "./tests/e2e-portal",
  fullyParallel: false,
  // No retries: a portal flake is a bug in the flow, not noise to retry past.
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: stack.clientOrigin,
    trace: "on-first-retry"
  },
  projects: [
    {
      // A phone held upright: the portal is built for one.
      name: "phone",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true }
    }
  ],
  webServer: [
    {
      command: "pnpm --filter @wingnight/teaser-worker e2e:portal-stack",
      // Any answer means the Worker is up; this one is a 401.
      url: `http://127.0.0.1:${stack.workerPort}/api/me`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // wrangler stops workerd cleanly on SIGINT, and leaves it running on a SIGKILL.
      gracefulShutdown: { signal: "SIGINT", timeout: 10_000 },
      env: {
        WN_E2E_PORTAL_STATE_DIR: stack.stateDir,
        WN_E2E_PORTAL_WORKER_PORT: String(stack.workerPort),
        WN_E2E_PORTAL_CLIENT_ORIGIN: stack.clientOrigin,
        WRANGLER_SEND_METRICS: "false"
      }
    },
    {
      command: `pnpm --filter @wingnight/client exec vite --config vite.teaser.config.ts --host 127.0.0.1 --port ${stack.clientPort} --strictPort`,
      url: stack.clientOrigin,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        TEASER_PORTAL_DEV_ORIGIN: `http://127.0.0.1:${stack.workerPort}`
      }
    }
  ]
});
