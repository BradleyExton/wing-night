export { createInitialRoomState } from "./createInitialRoomState/index.js";

export {
  clearRoomStateFatalError,
  getRoomStateSnapshot,
  resetRoomState,
  resetGameToSetup,
  setRoomStateFatalError,
  setRoomStatePlayers,
  setRoomStateTeams,
  setRoomStateGameConfig,
  setRoomStateMinigameContent
} from "./baseMutations/index.js";

export {
  addPlayer,
  autoAssignRemainingPlayers,
  createTeam,
  assignPlayerToTeam,
  reorderTurnOrder
} from "./teamSetupMutations/index.js";

export {
  setWingParticipation,
  adjustTeamScore,
  setPendingMinigamePoints,
  dispatchMinigameAction,
  redoLastScoringMutation
} from "./scoringMutations/index.js";

export {
  pauseRoomTimer,
  resumeRoomTimer,
  extendRoomTimer
} from "./timerMutations/index.js";

export {
  skipTurnBoundary,
  advanceRoomStatePhase
} from "./phaseMutations/index.js";

export {
  applyRoomStateMutation,
  reportRoomStateMutation
} from "./mutationResult/index.js";
export type { RoomStateMutationResult } from "./mutationResult/index.js";
