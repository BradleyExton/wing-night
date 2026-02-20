import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  type MinigameActionPayload,
  type MinigameType
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../resolveHostSecretRequest";
import { readHostSecret } from "../hostSecretStorage";

type RequestMinigameActionSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestMinigameAction = (
  socket: RequestMinigameActionSocket,
  minigameId: MinigameType,
  actionType: string,
  actionPayload: SerializableValue,
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

  const payload: MinigameActionPayload = {
    hostSecret,
    minigameApiVersion: MINIGAME_API_VERSION,
    minigameId,
    actionType,
    actionPayload
  };

  socket.emit(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, payload);

  return true;
};
