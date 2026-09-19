import { resolve } from "node:path";

import express from "express";
import {
  CONTENT_ASSET_ROUTE_PATH,
  LOBBY_AUDIO_ROUTE_PATH,
  SONG_GUESS_AUDIO_ROUTE_PATH,
  TEAM_AUDIO_ROUTE_PATH
} from "@wingnight/shared";

import {
  resolveContentLayerDirs,
  resolveContentRootDir
} from "../contentLoader/contentLoaderUtils/index.js";
import { healthRouter } from "../routes/health/index.js";

type CreateAppOptions = {
  contentRootDir?: string;
};

const allowCrossOriginMedia: express.RequestHandler = (_request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  next();
};

export const createApp = (options: CreateAppOptions = {}): express.Express => {
  // Resolved at CALL time, not module scope — `resolveContentRootDir` reads
  // WN_CONTENT_ROOT_DIR, which the e2e stack points at its own seeded root.
  const contentRootDir = options.contentRootDir ?? resolveContentRootDir();
  const layerDirs = resolveContentLayerDirs(contentRootDir);
  const app = express();

  // One mount per content layer, in the SAME order the loaders read them, so a
  // pack that overrides a file overrides the asset that goes with it.
  // `express.static` defaults to `fallthrough: true`, so a miss (or an absent
  // directory) falls through to the next layer and finally to a 404. Paths are
  // absolute because the server's dev cwd is apps/server, so a cwd-relative
  // string would resolve against the wrong tree.
  const mountPerLayer = (routePath: string, relativeDir: string): void => {
    for (const layerDir of layerDirs) {
      app.use(routePath, express.static(resolve(layerDir, relativeDir)));
    }
  };

  app.use("/health", healthRouter);

  // The TV listens to its own music: the display taps its `<audio>` with a
  // Web Audio analyser to find the beat the lobby cast dances to (DESIGN.md
  // §2.8). A media element on another origin only reaches that graph when the
  // response says it may — without this header the analyser hears silence and,
  // worse, so does the room, because the element's sound now routes through
  // the graph. The display marks the element `crossOrigin="anonymous"` to ask.
  app.use(
    [CONTENT_ASSET_ROUTE_PATH, TEAM_AUDIO_ROUTE_PATH, SONG_GUESS_AUDIO_ROUTE_PATH, LOBBY_AUDIO_ROUTE_PATH],
    allowCrossOriginMedia
  );

  // The content pack's images: generated heads, party photos, anything a
  // player's `avatarSrc` or a GEO prompt's `imageSrc` names. Served from the
  // pack rather than the client's Vite public/ directory because the pack lives
  // outside the repo — and because a client-served asset URL is root-relative,
  // which 404s on the TV: there is no dev proxy here, so the display is always
  // a different origin from the server. `resolveContentAssetSrc` is the client
  // half of this route.
  mountPerLayer(CONTENT_ASSET_ROUTE_PATH, "assets");

  mountPerLayer(TEAM_AUDIO_ROUTE_PATH, "teams/audio");

  // Song Guess covers. The pack ships as JSON only — the MP3s are event-night
  // assets the host drops into the pack.
  mountPerLayer(SONG_GUESS_AUDIO_ROUTE_PATH, "minigames/song-guess/audio");

  // Lobby music. Mounted ONCE, local only, matching `loadLobbyPlaylist`: the
  // enumeration and the route have to agree about where the files live, or the
  // TV gets a playlist of 404s. There is no sample lobby music to fall back to
  // — nobody's party clips belong in the repo.
  app.use(
    LOBBY_AUDIO_ROUTE_PATH,
    express.static(resolve(contentRootDir, "local", "audio", "lobby"))
  );

  return app;
};
