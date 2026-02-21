import type { RoomState } from "@wingnight/shared";

export const isRoomInFatalState = (state: RoomState): boolean => {
  return state.fatalError !== null;
};
