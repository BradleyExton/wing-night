import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringSetWingParticipationPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
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
  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    onMissingHostSecret,
    getHostSecret,
    createPayload: (hostSecret): ScoringSetWingParticipationPayload => ({
      hostSecret,
      playerId,
      didEat
    })
  });
};
