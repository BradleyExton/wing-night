import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupAddPlayerPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
import { readHostSecret } from "../hostSecretStorage";

type AddPlayerSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestAddPlayer = (
  socket: AddPlayerSocket,
  name: string,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const normalizedName = name.trim();

  return emitHostAuthorizedRequest({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.ADD_PLAYER,
    onMissingHostSecret,
    getHostSecret,
    canEmit: () => normalizedName.length > 0,
    createPayload: (hostSecret): SetupAddPlayerPayload => ({
      hostSecret,
      name: normalizedName
    })
  });
};
