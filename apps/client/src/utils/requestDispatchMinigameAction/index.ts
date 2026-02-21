import {
  CLIENT_TO_SERVER_EVENTS,
  type MinigameActionEnvelopePayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { readHostSecret } from "../hostSecretStorage";
import { resolveHostSecretRequest } from "../resolveHostSecretRequest";

type DispatchMinigameActionSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

type DispatchMinigameActionPayloadWithoutSecret = Omit<
  MinigameActionEnvelopePayload,
  "hostSecret"
>;

export const requestDispatchMinigameAction = (
  socket: DispatchMinigameActionSocket,
  payload: DispatchMinigameActionPayloadWithoutSecret,
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

  socket.emit(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
    hostSecret,
    ...payload
  });

  return true;
};
