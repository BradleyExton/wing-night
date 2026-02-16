import { Phase, type RoomState } from "@wingnight/shared";

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [],
    teams: []
  };
};

const roomState = createInitialRoomState();

export const getRoomStateSnapshot = (): RoomState => {
  return structuredClone(roomState);
};
