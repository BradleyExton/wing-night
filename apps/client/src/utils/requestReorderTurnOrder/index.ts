import {
  CLIENT_TO_SERVER_EVENTS,
  type GameReorderTurnOrderPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
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
  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    onMissingHostSecret,
    getHostSecret,
    canEmit: () => isValidTeamIdList(teamIds),
    createPayload: (hostSecret): GameReorderTurnOrderPayload => ({
      hostSecret,
      teamIds: [...teamIds]
    })
  });
};
