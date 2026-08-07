import { defineConfig, devices } from "@playwright/test";

import { E2E_CONTENT_ROOT_DIR } from "./tools/e2e-content-root/index.ts";
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
      // Seeds the throwaway content root in the same shell, before the server boots — see
      // tools/e2e-content-root/seedCli.ts for why this is not Playwright's globalSetup.
      command: "node tools/e2e-content-root/seedCli.ts && pnpm --filter @wingnight/server dev",
      url: `http://127.0.0.1:${serverPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        // The server reads its port from PORT (apps/server/src/index.ts); without this the
        // override would move the health-check URL but not the process it probes.
        PORT: String(serverPort),
        // `config:apply` writes <root>/local/ and local wins over sample on every later read,
        // so a suite that drives the config wizard against the repo's own content/ would
        // permanently rewrite the round-1 values host-display-sync.spec.ts asserts on — and
        // specs run in filename order under workers:1, so an admin-* spec sorts first and
        // reddens everything after it. The command above seeds this root from content/sample.
        WN_CONTENT_ROOT_DIR: E2E_CONTENT_ROOT_DIR
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
