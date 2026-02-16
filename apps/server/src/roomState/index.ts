import { Phase, type RoomState } from "@wingnight/shared";

import { logPhaseTransition } from "../logger/index.js";
import { getNextPhase } from "../utils/getNextPhase/index.js";

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

const overwriteRoomState = (nextState: RoomState): void => {
  Object.assign(roomState, nextState);
};

export const getRoomStateSnapshot = (): RoomState => {
  return structuredClone(roomState);
};

export const resetRoomState = (): RoomState => {
  overwriteRoomState(createInitialRoomState());

  return getRoomStateSnapshot();
};

export const advanceRoomStatePhase = (): RoomState => {
  const previousPhase = roomState.phase;
  const nextPhase = getNextPhase(previousPhase);

  roomState.phase = nextPhase;

  if (
    previousPhase === Phase.INTRO &&
    nextPhase === Phase.ROUND_INTRO &&
    roomState.currentRound === 0
  ) {
    roomState.currentRound = 1;
  }

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};
