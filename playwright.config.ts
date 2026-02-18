import { defineConfig, devices } from "@playwright/test";

const serverPort = 3000;
const clientPort = 5173;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
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
      command: `pnpm --filter @wingnight/server dev`,
      url: `http://127.0.0.1:${serverPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command:
        "pnpm --filter @wingnight/client dev -- --host 127.0.0.1 --port 5173",
      url: `http://localhost:${clientPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_SOCKET_SERVER_URL: `http://127.0.0.1:${serverPort}`
      }
    }
  ]
});
