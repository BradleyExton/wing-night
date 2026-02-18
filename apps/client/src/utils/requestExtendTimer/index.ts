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
import { readHostSecret } from "../hostSecretStorage";

type ExtendTimerSocket = Pick<Socket<InboundSocketEvents, OutboundSocketEvents>, "emit">;

export const requestExtendTimer = (
  socket: ExtendTimerSocket,
  additionalSeconds: number,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  if (
    !Number.isInteger(additionalSeconds) ||
    additionalSeconds <= 0 ||
    additionalSeconds > TIMER_EXTEND_MAX_SECONDS
  ) {
    return false;
  }

  const hostSecret = getHostSecret();

  if (!hostSecret) {
    onMissingHostSecret?.();
    return false;
  }

  const payload: TimerExtendPayload = {
    hostSecret,
    additionalSeconds
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, payload);

  return true;
};
