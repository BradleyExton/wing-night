import { CLIENT_TO_SERVER_EVENTS, type HostSecretPayload } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../resolveHostSecretRequest";
import { readHostSecret } from "../hostSecretStorage";

type NextPhaseSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestNextPhase = (
  socket: NextPhaseSocket,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const hostSecret = resolveHostSecretRequest({
    getHostSecret,
    onMissingHostSecret
  });

  if (hostSecret === null) {
    return false;
  }

  const payload: HostSecretPayload = { hostSecret };
  socket.emit(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, payload);

  return true;
};
