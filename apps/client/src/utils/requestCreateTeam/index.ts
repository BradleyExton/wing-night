import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupCreateTeamPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveHostSecretRequest } from "../resolveHostSecretRequest";
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

  const hostSecret = resolveHostSecretRequest({
    getHostSecret,
    onMissingHostSecret,
    canEmit: () => normalizedName.length > 0
  });

  if (hostSecret === null) {
    return false;
  }

  const payload: SetupCreateTeamPayload = {
    hostSecret,
    name: normalizedName
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, payload);

  return true;
};
