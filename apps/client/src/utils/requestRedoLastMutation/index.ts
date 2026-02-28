import { CLIENT_TO_SERVER_EVENTS, type HostSecretPayload } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
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
  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    onMissingHostSecret,
    getHostSecret,
    createPayload: (hostSecret): HostSecretPayload => ({ hostSecret })
  });
};
