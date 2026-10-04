import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig, type Plugin, type ProxyOptions } from "vite";

import { SAME_ORIGIN_SERVER_URL } from "./src/utils/resolveServerOrigin";

// The online teaser (wingnight.tv): the lobby and a few minigames, playable on a phone with no
// party server behind them. It is a second entry into this app rather than an app of its own so
// it can compose the TV's lobby scene and the minigame packages as they are, and it is a separate
// build so none of the party app — the host deck, the sockets, the admin wizard — ships with it.
//
// The party app still has no Vite config; `pnpm dev` and `pnpm build` never read this file.
const clientRoot = fileURLToPath(new URL(".", import.meta.url));
const publicDir = fileURLToPath(new URL("./teaser-public", import.meta.url));

// Where the site lives, for the link preview: a scraper wants the picture's full URL.
const TEASER_SITE_URL =
  process.env.TEASER_SITE_URL ?? "https://wingnight.tv";
const SHARE_CARD_FILE = "share-card.png";

// Names the link-preview picture (`pnpm teaser:card`) when the build has one to serve.
const shareCardMeta = (): Plugin => ({
  name: "teaser-share-card-meta",
  transformIndexHtml: () =>
    existsSync(`${publicDir}/${SHARE_CARD_FILE}`)
      ? [
          {
            tag: "meta",
            attrs: { property: "og:image", content: `${TEASER_SITE_URL}/${SHARE_CARD_FILE}` },
            injectTo: "head"
          },
          { tag: "meta", attrs: { property: "og:image:width", content: "1200" }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:image:height", content: "630" }, injectTo: "head" },
          { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" }, injectTo: "head" }
        ]
      : []
});

// The lobby's song (`tools/build-teaser` copies it out of the pack), named to the page only when
// the build has one: without it the landing has no music pill at all.
const LOBBY_TRACK_DIR = "lobby";
const lobbyTrackFileName = existsSync(`${publicDir}/${LOBBY_TRACK_DIR}`)
  ? readdirSync(`${publicDir}/${LOBBY_TRACK_DIR}`).find((fileName) => fileName.endsWith(".mp3"))
  : undefined;
const lobbyTrackDefine =
  lobbyTrackFileName === undefined
    ? {}
    : {
        "import.meta.env.VITE_TEASER_LOBBY_TRACK_SRC": JSON.stringify(
          `/${LOBBY_TRACK_DIR}/${encodeURIComponent(lobbyTrackFileName)}`
        )
      };

// The guest portal (apps/teaser-worker), which `pnpm teaser:dev` runs under `wrangler dev` here.
// The party app's "no dev proxy" rule is the party app's: its client and server are separate
// origins on the night as well. The teaser is the opposite — in production the pages and the
// portal ARE one origin, wingnight.tv — so in dev Vite stands in for that origin and forwards the
// Worker's two prefixes to it, the same two `run_worker_first` names in wrangler.jsonc. The dev
// script pins Vite to 5173 with --strictPort, because the Worker builds its sign-in links on
// that origin (PUBLIC_ORIGIN in apps/teaser-worker's dev script) and a drifted port would break them.
const PORTAL_DEV_ORIGIN = process.env.TEASER_PORTAL_DEV_ORIGIN ?? "http://localhost:8787";

const portalProxy: ProxyOptions = {
  target: PORTAL_DEV_ORIGIN,
  changeOrigin: true,
  // The Worker refuses a state-changing request whose Origin is not its own. A page Vite served
  // is same-origin with Vite, so that Origin is translated to the Worker's, as one origin needs no
  // translating in production; any other Origin passes through untouched and is refused.
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyRequest, request) => {
      if (request.headers.origin === `http://${request.headers.host}`) {
        proxyRequest.setHeader("origin", PORTAL_DEV_ORIGIN);
      }
    });
  }
};

export default defineConfig({
  root: fileURLToPath(new URL("./teaser", import.meta.url)),
  // Filled by `tools/build-teaser`: the fonts, the chosen players' heads and the roster, copied
  // out of the night pack. Gitignored, because the heads are the pack's and never the repo's.
  publicDir,
  plugins: [shareCardMeta()],
  // The content assets are served from the page's own origin here, so the client's
  // "server is always another origin" resolver is pointed back at the page.
  define: {
    "import.meta.env.VITE_SOCKET_SERVER_URL": JSON.stringify(SAME_ORIGIN_SERVER_URL),
    ...lobbyTrackDefine
  },
  css: {
    postcss: clientRoot
  },
  server: {
    proxy: {
      "^/api/": portalProxy,
      "^/s/": portalProxy
    },
    fs: {
      allow: [fileURLToPath(new URL("../..", import.meta.url))]
    }
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-teaser", import.meta.url)),
    emptyOutDir: true
  }
});
