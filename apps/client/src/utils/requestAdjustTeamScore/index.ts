import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringAdjustTeamScorePayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
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
  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    onMissingHostSecret,
    getHostSecret,
    canEmit: () => Number.isInteger(delta) && delta !== 0 && teamId.trim().length > 0,
    createPayload: (hostSecret): ScoringAdjustTeamScorePayload => ({
      hostSecret,
      teamId,
      delta
    })
  });
};
