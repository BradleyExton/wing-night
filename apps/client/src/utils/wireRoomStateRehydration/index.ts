import type { RoomState } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";

type RoomStateSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit"
>;

export const wireRoomStateRehydration = (
  socket: RoomStateSocket,
  onSnapshot: (roomState: RoomState) => void
): (() => void) => {
  const requestLatestState = (): void => {
    socket.emit("client:requestState");
  };

  const handleSnapshot = (roomState: RoomState): void => {
    onSnapshot(roomState);
  };

  socket.on("connect", requestLatestState);
  socket.on("server:stateSnapshot", handleSnapshot);

  return (): void => {
    socket.off("connect", requestLatestState);
    socket.off("server:stateSnapshot", handleSnapshot);
  };
};
