import { CLIENT_TO_SERVER_EVENTS } from "@wingnight/shared";

import { readHostSecret } from "../hostSecretStorage";
import {
  requestHostSecretOnly,
  type HostSecretOnlyRequestSocket
} from "../requestHostSecretOnly";

export const requestResetGame = (
  socket: HostSecretOnlyRequestSocket,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  return requestHostSecretOnly({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.RESET,
    onMissingHostSecret,
    getHostSecret
  });
};
