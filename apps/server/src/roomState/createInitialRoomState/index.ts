import { Phase, type RoomState } from "@wingnight/shared";

const DEFAULT_TOTAL_ROUNDS = 3;

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    players: [],
    teams: [],
    gameConfig: null,
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: false
  };
};
