import { defineConfig, devices } from "@playwright/test";

import { resolvePort } from "./tools/playwright-ports/index.mjs";

// Ports are env-overridable so a gate run can boot its own stack on dedicated ports instead of
// reusing whatever dev server holds 3000/5173 — reuse silently tests a foreign worktree's code
// (WN-5). Defaults keep interactive `pnpm test:e2e` and CI on the conventional ports; the gate
// commands in `.work/manifest.yml` pin the dedicated ones.
const serverPort = resolvePort(process.env, "WN_E2E_SERVER_PORT", 3000);
const clientPort = resolvePort(process.env, "WN_E2E_CLIENT_PORT", 5173);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${clientPort}`,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "pnpm --filter @wingnight/server dev",
      url: `http://127.0.0.1:${serverPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        // The server reads its port from PORT (apps/server/src/index.ts); without this the
        // override would move the health-check URL but not the process it probes.
        PORT: String(serverPort)
      }
    },
    {
      // `exec vite`, not `dev -- <flags>`: pnpm forwards the `--` itself, and Vite then ignores
      // every flag after it — the previous `dev -- --port 5173` was inert and only appeared to
      // work because 5173 is Vite's default. `exec` hands the flags straight to Vite.
      // --strictPort: Vite otherwise hops to the next free port, leaving Playwright polling a URL
      // nothing is bound to. Failing loudly on the requested port is the point.
      command: `pnpm --filter @wingnight/client exec vite --host 127.0.0.1 --port ${clientPort} --strictPort`,
      url: `http://localhost:${clientPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_SOCKET_SERVER_URL: `http://127.0.0.1:${serverPort}`
      }
    }
  ]
});
