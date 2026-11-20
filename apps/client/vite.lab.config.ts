import { fileURLToPath } from "node:url";

import { defineConfig, type ProxyOptions } from "vite";

// PROTOTYPE — throwaway (docs/minigames/base-borden-spec.md §0.7 step 1): the online jump lab, a
// third entry into this app like the teaser's, built into dist-lab and served by its own Worker
// (apps/teaser-worker/wrangler.lab.jsonc). Deleting the lab deletes this file, lab/ and
// src/labMain.tsx.
//
// In production the pages and the rooms are one origin. In dev Vite stands in for it and forwards
// `/room/` (WebSockets) to `wrangler dev` (`pnpm --filter @wingnight/teaser-worker lab:dev`).
const LAB_ROOM_DEV_ORIGIN = process.env.LAB_ROOM_DEV_ORIGIN ?? "http://localhost:8788";

const roomProxy: ProxyOptions = {
  target: LAB_ROOM_DEV_ORIGIN,
  ws: true,
  changeOrigin: true,
  // The Worker refuses a room whose Origin is another site's. A page Vite served is same-origin
  // with Vite, so that Origin is translated to the Worker's, as one origin needs no translating in
  // production.
  configure: (proxy) => {
    proxy.on("proxyReqWs", (proxyRequest, request) => {
      if (request.headers.origin === `http://${request.headers.host}`) {
        proxyRequest.setHeader("origin", LAB_ROOM_DEV_ORIGIN);
      }
    });
  }
};

export default defineConfig({
  root: fileURLToPath(new URL("./lab", import.meta.url)),
  // The lab draws no photos and needs none of the party's public files; its text falls back to
  // the system fonts.
  publicDir: false,
  css: {
    postcss: fileURLToPath(new URL(".", import.meta.url))
  },
  server: {
    proxy: {
      "^/room/": roomProxy
    },
    fs: {
      allow: [fileURLToPath(new URL("../..", import.meta.url))]
    }
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-lab", import.meta.url)),
    emptyOutDir: true
  }
});
