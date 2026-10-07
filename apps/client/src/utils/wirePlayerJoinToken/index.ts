import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS,
  isNonEmptyString,
  type PlayerJoinTokenPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type { InboundSocketEvents, OutboundSocketEvents } from "../../socketContracts/index";

type PlayerJoinTokenSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit" | "connected"
>;

// The TV's half of the player QR: the server hands the join token to the
// laptop's display on connect and again whenever it rotates. The page attaches
// this listener in an effect, which can land after that first emit — so, the
// same way `wireRoomStateRehydration` asks for state, a display that is
// already connected asks for the token. A display anywhere else has no
// listener for the ask on the server and never hears the event, so it never
// draws the code.
export const wirePlayerJoinToken = (
  socket: PlayerJoinTokenSocket,
  onJoinToken: (joinToken: string) => void
): (() => void) => {
  const handleJoinToken = (payload: PlayerJoinTokenPayload): void => {
    if (isNonEmptyString(payload?.joinToken)) {
      onJoinToken(payload.joinToken);
    }
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN, handleJoinToken);

  if (socket.connected) {
    socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_PLAYER_JOIN_TOKEN);
  }

  return (): void => {
    socket.off(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN, handleJoinToken);
  };
};
