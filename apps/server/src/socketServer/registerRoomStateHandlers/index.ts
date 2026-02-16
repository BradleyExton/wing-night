import type { RoomState } from "@wingnight/shared";

type RoomStateSocket = {
  emit: (event: "server:stateSnapshot", roomState: RoomState) => void;
  on: (event: "client:requestState", listener: () => void) => void;
};

export const registerRoomStateHandlers = (
  socket: RoomStateSocket,
  getSnapshot: () => RoomState
): void => {
  const emitSnapshot = (): void => {
    socket.emit("server:stateSnapshot", getSnapshot());
  };

  emitSnapshot();

  socket.on("client:requestState", emitSnapshot);
};
