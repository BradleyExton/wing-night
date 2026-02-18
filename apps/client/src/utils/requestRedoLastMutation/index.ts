import { CLIENT_TO_SERVER_EVENTS, type HostSecretPayload } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { readHostSecret } from "../hostSecretStorage";

type RedoLastMutationSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestRedoLastMutation = (
  socket: RedoLastMutationSocket,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const hostSecret = getHostSecret();

  if (!hostSecret) {
    onMissingHostSecret?.();
    return false;
  }

  const payload: HostSecretPayload = { hostSecret };
  socket.emit(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, payload);

  return true;
};
