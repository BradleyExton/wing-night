import {
  Phase,
  type GameConfigFile,
  type Player,
  type RoomState,
  type Team
} from "@wingnight/shared";

export const fixturePlayers: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" }
];

export const fixtureTeams: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-1"],
    totalScore: 10
  },
  {
    id: "team-beta",
    name: "Team Beta",
    playerIds: ["player-2"],
    totalScore: 8
  }
];

export const buildGameConfig = (
  overrides: Partial<GameConfigFile> = {}
): GameConfigFile => {
  return {
    name: "Fixture Config",
    rounds: [
      {
        round: 1,
        label: "Warm Up",
        sauce: "Frank's",
        pointsPerPlayer: 2,
        minigame: "TRIVIA"
      }
    ],
    minigameScoring: {
      defaultMax: 15,
      finalRoundMax: 20
    },
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
    },
    ...overrides
  };
};

export const buildRoomState = (
  overrides: Partial<RoomState> = {}
): RoomState => {
  const gameConfig =
    overrides.gameConfig === undefined ? buildGameConfig() : overrides.gameConfig;

  return {
    phase: Phase.SETUP,
    currentRound: 1,
    totalRounds: 1,
    players: fixturePlayers,
    teams: fixtureTeams,
    gameConfig,
    currentRoundConfig: gameConfig?.rounds[0] ?? null,
    turnOrderTeamIds: fixtureTeams.map((team) => team.id),
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: fixtureTeams[0]?.id ?? null,
    activeTurnTeamId: null,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: true,
    ...overrides
  };
};
