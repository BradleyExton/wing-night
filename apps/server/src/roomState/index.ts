export { createInitialRoomState } from "./createInitialRoomState/index.js";

export {
  clearRoomStateFatalError,
  getRoomStateSnapshot,
  resetRoomState,
  resetGameToSetup,
  setRoomStateFatalError,
  setRoomStatePlayers,
  setRoomStateTeams,
  setRoomStateEatingPlaylist,
  setRoomStateLobbyPlaylist,
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
  pauseRoomMusic,
  previousRoomMusicTrack,
  reportRoomMusicTrackEnded,
  resumeRoomMusic,
  setRoomMusicVolume,
  setRoomSfxVolume,
  skipRoomMusicTrack
} from "./musicMutations/index.js";

export {
  skipTurnBoundary,
  startGame,
  advanceRoomStatePhase
} from "./phaseMutations/index.js";

export { startQuickPlay } from "./quickPlayMutations/index.js";

export {
  dispatchContestantMinigameAction,
  dispatchServerMinigameAction,
  readContestantActionRefusal,
  readMinigameDeadline,
  setRoundDeviceMode,
  takeBackContestantLeg
} from "./contestantMutations/index.js";

export { getRoomPhase, getRoomPlayers } from "./stateStore/index.js";

export {
  releasePlayerClaimByHost,
  rotatePlayerJoinTokenByHost,
  syncPlayerClaimFlags
} from "./playerClaimMutations/index.js";

export {
  applyRoomStateMutation,
  reportRoomStateMutation
} from "./mutationResult/index.js";
export type { RoomStateMutationResult } from "./mutationResult/index.js";
