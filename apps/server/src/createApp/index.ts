import express from "express";
import { devBoardRouter } from "../routes/devBoard/index.js";
import { healthRouter } from "../routes/health/index.js";

// Fail-closed, and read HERE rather than at module scope for two reasons: a
// module-scope read would freeze the first value seen, making the mounted and
// unmounted cases untestable in one run; and no script sets this flag, so the
// party-night boot (`pnpm dev`) never mounts the board. You opt in per
// invocation with `WN_DEV_BOARD=1 pnpm dev`.
const isDevBoardEnabled = (): boolean => {
  return process.env.WN_DEV_BOARD === "1";
};

export const createApp = (): express.Express => {
  const app = express();

  app.use("/health", healthRouter);

  if (isDevBoardEnabled()) {
    app.use("/api/dev/board", devBoardRouter);
  }

  return app;
};
