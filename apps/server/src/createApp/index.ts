import { resolve } from "node:path";

import express from "express";
import {
  SONG_GUESS_AUDIO_ROUTE_PATH,
  TEAM_AUDIO_ROUTE_PATH
} from "@wingnight/shared";

import { resolveContentRootDir } from "../contentLoader/contentLoaderUtils/index.js";
import { healthRouter } from "../routes/health/index.js";

type CreateAppOptions = {
  contentRootDir?: string;
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

  // Song Guess covers, same local-wins fallback. The pack ships as JSON only —
  // the MP3s are event-night assets the host drops into `content/local/`.
  app.use(
    SONG_GUESS_AUDIO_ROUTE_PATH,
    express.static(resolve(contentRootDir, "local", "minigames", "song-guess", "audio"))
  );
  app.use(
    SONG_GUESS_AUDIO_ROUTE_PATH,
    express.static(resolve(contentRootDir, "sample", "minigames", "song-guess", "audio"))
  );

  return app;
};
