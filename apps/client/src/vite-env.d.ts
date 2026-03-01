/* eslint-disable @typescript-eslint/consistent-type-definitions */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCKET_SERVER_URL?: string;
  readonly VITE_HOST_CONTROL_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
