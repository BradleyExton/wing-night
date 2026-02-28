import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupCreateTeamPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
import { readHostSecret } from "../hostSecretStorage";

type CreateTeamSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestCreateTeam = (
  socket: CreateTeamSocket,
  name: string,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const normalizedName = name.trim();

  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    onMissingHostSecret,
    getHostSecret,
    canEmit: () => normalizedName.length > 0,
    createPayload: (hostSecret): SetupCreateTeamPayload => ({
      hostSecret,
      name: normalizedName
    })
  });
};
