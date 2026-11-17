/* eslint-disable @typescript-eslint/consistent-type-definitions */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCKET_SERVER_URL?: string;
  readonly VITE_HOST_CONTROL_TOKEN?: string;
  // The teaser's lobby track, set by vite.teaser.config.ts only when the build carries one.
  readonly VITE_TEASER_LOBBY_TRACK_SRC?: string;
  // The server's port when it is not 3000, on whatever host the page was opened at
  // (`resolveServerOrigin`): a second stack beside one that already holds the default ports.
  readonly VITE_SOCKET_SERVER_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
