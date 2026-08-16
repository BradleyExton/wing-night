import { resolve } from "node:path";

import express from "express";
import { TEAM_AUDIO_ROUTE_PATH } from "@wingnight/shared";

import { resolveContentRootDir } from "../contentLoader/contentLoaderUtils/index.js";
import { devBoardRouter } from "../routes/devBoard/index.js";
import { healthRouter } from "../routes/health/index.js";

type CreateAppOptions = {
  contentRootDir?: string;
};

// Fail-closed, and read HERE rather than at module scope for two reasons: a
// module-scope read would freeze the first value seen, making the mounted and
// unmounted cases untestable in one run; and no script sets this flag, so the
// party-night boot (`pnpm dev`) never mounts the board. You opt in per
// invocation with `WN_DEV_BOARD=1 pnpm dev`.
const isDevBoardEnabled = (): boolean => {
  return process.env.WN_DEV_BOARD === "1";
};

export const createApp = (options: CreateAppOptions = {}): express.Express => {
  // Resolved at CALL time, not module scope — `resolveContentRootDir` reads
  // WN_CONTENT_ROOT_DIR, which the e2e stack points at its own seeded root.
  const contentRootDir = options.contentRootDir ?? resolveContentRootDir();
  const app = express();

  app.use("/health", healthRouter);

  // Mounted twice, local first, mirroring `loadContentFileWithFallback`'s
  // local-wins fallback: express.static defaults to `fallthrough: true`, so a
  // miss (or an absent directory) falls through to the sample mount and then
  // to a 404. Paths are absolute because the server's dev cwd is apps/server,
  // so a cwd-relative string would resolve against the wrong tree.
  app.use(
    TEAM_AUDIO_ROUTE_PATH,
    express.static(resolve(contentRootDir, "local", "teams", "audio"))
  );
  app.use(
    TEAM_AUDIO_ROUTE_PATH,
    express.static(resolve(contentRootDir, "sample", "teams", "audio"))
  );

  if (isDevBoardEnabled()) {
    app.use("/api/dev/board", devBoardRouter);
  }

  return app;
};
