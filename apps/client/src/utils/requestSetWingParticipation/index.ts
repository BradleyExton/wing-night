import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringSetWingParticipationPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../resolveHostSecretRequest";
import { readHostSecret } from "../hostSecretStorage";

type SetWingParticipationSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestSetWingParticipation = (
  socket: SetWingParticipationSocket,
  playerId: string,
  didEat: boolean,
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

  const payload: ScoringSetWingParticipationPayload = {
    hostSecret,
    playerId,
    didEat
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, payload);

  return true;
};
