import { CLIENT_TO_SERVER_EVENTS } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { requestHostSecretOnly } from "../requestHostSecretOnly";

type AutoAssignRemainingPlayersSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestAutoAssignRemainingPlayers = (
  socket: AutoAssignRemainingPlayersSocket,
  onMissingHostSecret?: () => void,
  getHostSecret?: () => string | null
): boolean => {
  return requestHostSecretOnly({
    socket,
    event: CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS,
    onMissingHostSecret,
    getHostSecret
  });
};
