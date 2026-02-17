import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS,
  type RoomState
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";

type RoomStateSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit" | "connected"
>;

export const wireRoomStateRehydration = (
  socket: RoomStateSocket,
  onSnapshot: (roomState: RoomState) => void
): (() => void) => {
  const requestLatestState = (): void => {
    socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE);
  };

  const handleSnapshot = (roomState: RoomState): void => {
    onSnapshot(roomState);
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, handleSnapshot);
  if (socket.connected) {
    requestLatestState();
  }

  return (): void => {
    socket.off(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, handleSnapshot);
  };
};
