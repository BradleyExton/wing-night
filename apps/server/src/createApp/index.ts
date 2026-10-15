import { join, resolve } from "node:path";

import express from "express";
import {
  CONTENT_ASSET_ROUTE_PATH,
  DEV_SANDBOX_MANIFEST_ROUTE_PATH,
  EATING_AUDIO_ROUTE_PATH,
  HOST_JOIN_ROUTE_PATH,
  LAN_ADDRESSES_ROUTE_PATH,
  LOBBY_AUDIO_ROUTE_PATH,
  SFX_TAKES_ROUTE_PATH,
  SONG_GUESS_AUDIO_ROUTE_PATH,
  TEAM_AUDIO_ROUTE_PATH
} from "@wingnight/shared";

import {
  resolveContentLayerDirs,
  resolveContentRootDir
} from "../contentLoader/contentLoaderUtils/index.js";
import { RECREATE_ATTEMPTS_PACK_PATH } from "../minigames/recreateGeneration/recreateEditPrompt/index.js";
import { createDevSandboxRouter } from "../routes/devSandbox/index.js";
import { healthRouter } from "../routes/health/index.js";
import { createHostJoinRouter } from "../routes/hostJoin/index.js";
import { createLanAddressesRouter } from "../routes/lanAddresses/index.js";
import { createSfxTakesRouter } from "../routes/sfxTakes/index.js";

type CreateAppOptions = {
  contentRootDir?: string;
  // The boot's host control token, the same one the socket guard checks.
  hostControlToken: string;
};

// Party content does not change while the party is running, and the room is on
// house Wi-Fi with a tablet and a TV that mount the same heads over and over —
// the SETUP parade alone remounts every player's avatar each time the pairs
// rotate. Without this, `express.static` sends `max-age=0` and each of those
// remounts is a conditional round-trip for a byte-identical file. An hour
// covers a night's worth of rotations, and nothing here is fingerprinted, so it
// is also the longest window we can hand out without making a between-parties
// content edit (import:avatars, pack:pull, /admin) feel broken. If content ever
// changes mid-party, the fix is a content hash in `resolveContentAssetSrc`, not
// a shorter max-age.
const PARTY_ASSET_MAX_AGE = "1h";

// The forgeries RECREATE paints DURING the night are the one exception, and
// they have to stay revalidated. The file name comes from the attempt id, which
// restarts its sequence every turn, so a dry run before the guests arrive and
// the real party after a reset write DIFFERENT images to the SAME file name.
// Cached for an hour the TV would show the dry run's forgery. This is one image
// per attempt, fetched once, so there is nothing to save by caching it.
const LIVE_WRITTEN_ASSET_MAX_AGE = 0;

const allowCrossOriginMedia: express.RequestHandler = (_request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  next();
};

export const createApp = (options: CreateAppOptions): express.Express => {
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
  const mountPerLayer = (
    routePath: string,
    relativeDir: string,
    maxAge: string | number = PARTY_ASSET_MAX_AGE
  ): void => {
    for (const layerDir of layerDirs) {
      app.use(routePath, express.static(resolve(layerDir, relativeDir), { maxAge }));
    }
  };

  app.use("/health", healthRouter);

  // The dev sandbox's seed content. Cross-origin like the media routes and for
  // the same reason — the sandbox is a client page, and there is no dev proxy
  // here — but it is JSON fetched by script rather than a media element, so it
  // needs the header on its own mount.
  app.use(
    DEV_SANDBOX_MANIFEST_ROUTE_PATH,
    allowCrossOriginMedia,
    createDevSandboxRouter({ contentRootDir })
  );

  // Which recorded takes the TV can play for a game's cues. JSON fetched by
  // script, like the sandbox manifest, so it carries the header on its own
  // mount; the takes themselves are ordinary content assets.
  app.use(
    SFX_TAKES_ROUTE_PATH,
    allowCrossOriginMedia,
    createSfxTakesRouter({ contentRootDir })
  );

  // The laptop's Wi-Fi addresses, open to any origin and carrying no token.
  // The host QR no longer reads this (it reads `/host-join` below); it stays
  // for pages that need the addresses but must never hold the host seat's key —
  // the TV's player QR for the guests' phones, whose join token arrives over
  // the socket instead (`display:playerJoinToken`, laptop displays only).
  app.use(LAN_ADDRESSES_ROUTE_PATH, allowCrossOriginMedia, createLanAddressesRouter());

  // The same addresses plus the host control token, for the laptop's host QR
  // alone. No blanket CORS header: the route reflects a loopback Origin itself
  // and refuses everything else, so neither a LAN device nor a web page open on
  // the laptop can read the key to the host seat.
  app.use(
    HOST_JOIN_ROUTE_PATH,
    createHostJoinRouter({ hostControlToken: options.hostControlToken })
  );

  // The TV listens to its own music: the display taps its `<audio>` with a
  // Web Audio analyser to find the beat the lobby cast dances to (DESIGN.md
  // §2.8). A media element on another origin only reaches that graph when the
  // response says it may — without this header the analyser hears silence and,
  // worse, so does the room, because the element's sound now routes through
  // the graph. The display marks the element `crossOrigin="anonymous"` to ask.
  app.use(
    [
      CONTENT_ASSET_ROUTE_PATH,
      TEAM_AUDIO_ROUTE_PATH,
      SONG_GUESS_AUDIO_ROUTE_PATH,
      LOBBY_AUDIO_ROUTE_PATH,
      EATING_AUDIO_ROUTE_PATH
    ],
    allowCrossOriginMedia
  );

  // The content pack's images: generated heads, party photos, anything a
  // player's `avatarSrc` or a GEO prompt's `imageSrc` names. Served from the
  // pack rather than the client's Vite public/ directory because the pack lives
  // outside the repo — and because a client-served asset URL is root-relative,
  // which 404s on the TV: there is no dev proxy here, so the display is always
  // a different origin from the server. `resolveContentAssetSrc` is the client
  // half of this route.
  //
  // RECREATE's forgeries live under this same route, and they are the one part
  // of the pack written while the party runs. Their narrower path is mounted
  // FIRST so an attempt URL never reaches the hour-long mount below; everything
  // else falls straight through to it. Both mounts resolve an attempt to the
  // same file on disk, so there is no gap between them.
  mountPerLayer(
    `${CONTENT_ASSET_ROUTE_PATH}/${RECREATE_ATTEMPTS_PACK_PATH}`,
    join("assets", RECREATE_ATTEMPTS_PACK_PATH),
    LIVE_WRITTEN_ASSET_MAX_AGE
  );

  mountPerLayer(CONTENT_ASSET_ROUTE_PATH, "assets");

  mountPerLayer(TEAM_AUDIO_ROUTE_PATH, "teams/audio");

  // Name That Cheese covers. The pack ships as JSON only — the MP3s are event-night
  // assets the host drops into the pack.
  mountPerLayer(SONG_GUESS_AUDIO_ROUTE_PATH, "minigames/song-guess/audio");

  // Lobby music. Mounted ONCE, local only, matching `loadLobbyPlaylist`: the
  // enumeration and the route have to agree about where the files live, or the
  // TV gets a playlist of 404s. There is no sample lobby music to fall back to
  // — nobody's party clips belong in the repo.
  app.use(
    LOBBY_AUDIO_ROUTE_PATH,
    express.static(resolve(contentRootDir, "local", "audio", "lobby"), {
      maxAge: PARTY_ASSET_MAX_AGE
    })
  );
  // The bed under the wings, same convention and same reasons.
  app.use(
    EATING_AUDIO_ROUTE_PATH,
    express.static(resolve(contentRootDir, "local", "audio", "eating"), {
      maxAge: PARTY_ASSET_MAX_AGE
    })
  );

  return app;
};
