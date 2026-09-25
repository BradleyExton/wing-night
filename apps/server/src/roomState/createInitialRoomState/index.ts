import {
  MUSIC_VOLUME_DEFAULT,
  Phase,
  SESSION_MODES,
  type RoomState
} from "@wingnight/shared";

const DEFAULT_TOTAL_ROUNDS = 3;

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    sessionMode: SESSION_MODES.NIGHT,
    currentRound: 0,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    players: [],
    teams: [],
    lobbyPlaylist: [],
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
    gameStartCountdownEndsAt: null,
    musicPlayback: null,
    musicVolume: MUSIC_VOLUME_DEFAULT,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: false
  };
};
