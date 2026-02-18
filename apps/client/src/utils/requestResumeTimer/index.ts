import { CLIENT_TO_SERVER_EVENTS, type HostSecretPayload } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../emitHostSecretRequest";
import { readHostSecret } from "../hostSecretStorage";

type ResumeTimerSocket = Pick<Socket<InboundSocketEvents, OutboundSocketEvents>, "emit">;

export const requestResumeTimer = (
  socket: ResumeTimerSocket,
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
  socket.emit(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, payload);

  return true;
};
