import {
  CLIENT_TO_SERVER_EVENTS,
  TIMER_EXTEND_MAX_SECONDS,
  type TimerExtendPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
import { readHostSecret } from "../hostSecretStorage";

type ExtendTimerSocket = Pick<Socket<InboundSocketEvents, OutboundSocketEvents>, "emit">;

export const requestExtendTimer = (
  socket: ExtendTimerSocket,
  additionalSeconds: number,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    onMissingHostSecret,
    getHostSecret,
    canEmit: () =>
      Number.isInteger(additionalSeconds) &&
      additionalSeconds > 0 &&
      additionalSeconds <= TIMER_EXTEND_MAX_SECONDS,
    createPayload: (hostSecret): TimerExtendPayload => ({
      hostSecret,
      additionalSeconds
    })
  });
};
