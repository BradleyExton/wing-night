import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringAdjustTeamScorePayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../emitHostSecretRequest";
import { readHostSecret } from "../hostSecretStorage";

type AdjustTeamScoreSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestAdjustTeamScore = (
  socket: AdjustTeamScoreSocket,
  teamId: string,
  delta: number,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const hostSecret = resolveHostSecretRequest({
    getHostSecret,
    onMissingHostSecret,
    canEmit: () => Number.isInteger(delta) && delta !== 0 && teamId.trim().length > 0
  });

  if (hostSecret === null) {
    return false;
  }

  const payload: ScoringAdjustTeamScorePayload = {
    hostSecret,
    teamId,
    delta
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, payload);

  return true;
};
