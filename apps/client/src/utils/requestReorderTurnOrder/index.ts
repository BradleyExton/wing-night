import {
  CLIENT_TO_SERVER_EVENTS,
  type GameReorderTurnOrderPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../emitHostSecretRequest";
import { readHostSecret } from "../hostSecretStorage";

type ReorderTurnOrderSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

const isValidTeamIdList = (teamIds: string[]): boolean => {
  if (teamIds.length === 0) {
    return false;
  }

  const seenTeamIds = new Set<string>();

  for (const teamId of teamIds) {
    if (teamId.trim().length === 0 || seenTeamIds.has(teamId)) {
      return false;
    }

    seenTeamIds.add(teamId);
  }

  return true;
};

export const requestReorderTurnOrder = (
  socket: ReorderTurnOrderSocket,
  teamIds: string[],
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const hostSecret = resolveHostSecretRequest({
    getHostSecret,
    onMissingHostSecret,
    canEmit: () => isValidTeamIdList(teamIds)
  });

  if (hostSecret === null) {
    return false;
  }

  const payload: GameReorderTurnOrderPayload = {
    hostSecret,
    teamIds: [...teamIds]
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, payload);

  return true;
};
