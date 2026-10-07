import type {
  GameConfigFile,
  Phase,
  Player,
  RoomState,
  Team
} from "@wingnight/shared";

import type { MinigameRuntimeStateSnapshot } from "../../minigames/runtime/index.js";
import { createInitialRoomState } from "../createInitialRoomState/index.js";

export type ScoringMutationUndoSnapshot = {
  round: number;
  // Where in the night the undo point was taken: a game's runtime only comes
  // back when the room is still in that same turn's MINIGAME_PLAY.
  roundTurnCursor: number;
  phase: Phase;
  teamTotalScoreById: Record<string, number>;
  wingParticipationByPlayerId: Record<string, boolean>;
  pendingWingPointsByTeamId: Record<string, number>;
  pendingMinigamePointsByTeamId: Record<string, number>;
  minigameRuntimeSnapshot: MinigameRuntimeStateSnapshot;
  // The legs the tablet held when the point was taken: they belong with that runtime state. An
  // undo that hands back an earlier log hands back who held each leg then, so a leg the tablet
  // took after the point goes back to its phone.
  contestantTabletLegIndexes: number[] | null;
};

type SetupBaselineSnapshot = {
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

// A read of one field, for a caller that would otherwise clone the whole room
// through `getRoomStateSnapshot` to look at it.
export const getRoomPhase = (): RoomState["phase"] => {
  return roomState.phase;
};

// The roster, uncloned, for a claim check that only reads ids and names.
export const getRoomPlayers = (): readonly Player[] => {
  return roomState.players;
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
