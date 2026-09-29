import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig, type Plugin } from "vite";

import { SAME_ORIGIN_SERVER_URL } from "./src/utils/resolveServerOrigin";

// The online teaser (wingnight.tv): the lobby and a few minigames, playable on a phone with no
// party server behind them. It is a second entry into this app rather than an app of its own so
// it can compose the TV's lobby scene and the minigame packages as they are, and it is a separate
// build so none of the party app — the host deck, the sockets, the admin wizard — ships with it.
//
// The party app still has no Vite config; `pnpm dev` and `pnpm build` never read this file.
const clientRoot = fileURLToPath(new URL(".", import.meta.url));
const publicDir = fileURLToPath(new URL("./teaser-public", import.meta.url));

// Where the site lives, for the link preview: a scraper wants the picture's full URL. Override
// with TEASER_SITE_URL once the domain moves.
const TEASER_SITE_URL =
  process.env.TEASER_SITE_URL ?? "https://wingnight.politicalrecord-site.workers.dev";
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

export default defineConfig({
  root: fileURLToPath(new URL("./teaser", import.meta.url)),
  // Filled by `tools/build-teaser`: the fonts, the chosen players' heads and the roster, copied
  // out of the night pack. Gitignored, because the heads are the pack's and never the repo's.
  publicDir,
  plugins: [shareCardMeta()],
  // The content assets are served from the page's own origin here, so the client's
  // "server is always another origin" resolver is pointed back at the page.
  define: {
    "import.meta.env.VITE_SOCKET_SERVER_URL": JSON.stringify(SAME_ORIGIN_SERVER_URL)
  },
  css: {
    postcss: clientRoot
  },
  server: {
    fs: {
      allow: [fileURLToPath(new URL("../..", import.meta.url))]
    }
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-teaser", import.meta.url)),
    emptyOutDir: true
  }
});
