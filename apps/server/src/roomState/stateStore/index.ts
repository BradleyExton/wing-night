import type {
  GameConfigFile,
  Player,
  RoomState,
  Team
} from "@wingnight/shared";

import type { MinigameRuntimeStateSnapshot } from "../../minigames/runtime/index.js";
import { createInitialRoomState } from "../createInitialRoomState/index.js";

export type ScoringMutationUndoSnapshot = {
  round: number;
  teamTotalScoreById: Record<string, number>;
  wingParticipationByPlayerId: Record<string, boolean>;
  pendingWingPointsByTeamId: Record<string, number>;
  pendingMinigamePointsByTeamId: Record<string, number>;
  minigameRuntimeSnapshot: MinigameRuntimeStateSnapshot;
};

export type SetupBaselineSnapshot = {
  players: Player[];
  teams: Team[];
  gameConfig: GameConfigFile | null;
};

// This module-scoped state is intentionally single-process for the MVP.
// If the server is scaled across workers/processes, migrate to shared storage.
const roomState = createInitialRoomState();
let scoringMutationUndoSnapshot: ScoringMutationUndoSnapshot | null = null;
let setupBaselineSnapshot: SetupBaselineSnapshot = {
  players: [],
  teams: [],
  gameConfig: null
};

export const getRoomState = (): RoomState => {
  return roomState;
};

export const overwriteRoomState = (nextState: RoomState): void => {
  Object.assign(roomState, nextState);
};

export const getScoringMutationUndoSnapshot = (): ScoringMutationUndoSnapshot | null => {
  return scoringMutationUndoSnapshot;
};

export const setScoringMutationUndoSnapshot = (
  snapshot: ScoringMutationUndoSnapshot | null
): void => {
  scoringMutationUndoSnapshot = snapshot;
};

export const getSetupBaselineSnapshot = (): SetupBaselineSnapshot => {
  return structuredClone(setupBaselineSnapshot);
};

export const setSetupBaselineSnapshot = (
  snapshot: SetupBaselineSnapshot
): void => {
  setupBaselineSnapshot = structuredClone(snapshot);
};
