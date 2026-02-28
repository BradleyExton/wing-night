import { CLIENT_TO_SERVER_EVENTS, type HostSecretPayload } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
import { readHostSecret } from "../hostSecretStorage";

type PauseTimerSocket = Pick<Socket<InboundSocketEvents, OutboundSocketEvents>, "emit">;

export const requestPauseTimer = (
  socket: PauseTimerSocket,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE,
    onMissingHostSecret,
    getHostSecret,
    createPayload: (hostSecret): HostSecretPayload => ({ hostSecret })
  });
};
