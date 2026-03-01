import { CLIENT_TO_SERVER_EVENTS } from "@wingnight/shared";

import { readHostSecret } from "../hostSecretStorage";
import {
  requestHostSecretOnly,
  type HostSecretOnlyRequestSocket
} from "../requestHostSecretOnly";

export const requestRedoLastMutation = (
  socket: HostSecretOnlyRequestSocket,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  return requestHostSecretOnly({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    onMissingHostSecret,
    getHostSecret
  });
};
