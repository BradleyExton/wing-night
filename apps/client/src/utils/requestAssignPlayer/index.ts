import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupAssignPlayerPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../resolveHostSecretRequest";
import { readHostSecret } from "../hostSecretStorage";

type AssignPlayerSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestAssignPlayer = (
  socket: AssignPlayerSocket,
  playerId: string,
  teamId: string | null,
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

  const payload: SetupAssignPlayerPayload = {
    hostSecret,
    playerId,
    teamId
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, payload);

  return true;
};
