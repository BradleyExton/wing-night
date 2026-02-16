import { Phase, type RoomState } from "@wingnight/shared";

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [],
    teams: []
  };
};

// This module-scoped state is intentionally single-process for the MVP.
// If the server is scaled across workers/processes, migrate to shared storage.
const roomState = createInitialRoomState();

export const getRoomStateSnapshot = (): RoomState => {
  return structuredClone(roomState);
};
