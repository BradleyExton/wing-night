import { Phase, type RoomState } from "@wingnight/shared";

export const resolveCurrentRoundConfig = (
  state: RoomState
): RoomState["currentRoundConfig"] => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  return state.gameConfig.rounds[state.currentRound - 1] ?? null;
};

export const isTriviaMinigamePlayState = (state: RoomState): boolean => {
  return (
    state.phase === Phase.MINIGAME_PLAY &&
    state.currentRoundConfig?.minigame === "TRIVIA"
  );
};

export const resolveMinigamePointsMax = (state: RoomState): number | null => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  if (state.currentRound === state.totalRounds) {
    return state.gameConfig.minigameScoring.finalRoundMax;
  }

  return state.gameConfig.minigameScoring.defaultMax;
};

export const resolveTriviaQuestionsPerTurn = (state: RoomState): number => {
  const configuredQuestionsPerTurn =
    state.gameConfig?.minigameRules?.trivia?.questionsPerTurn;

  if (
    typeof configuredQuestionsPerTurn !== "number" ||
    !Number.isInteger(configuredQuestionsPerTurn) ||
    configuredQuestionsPerTurn <= 0
  ) {
    return 1;
  }

  return configuredQuestionsPerTurn;
};

export const resolveMinigameTimerSeconds = (state: RoomState): number | null => {
  if (!state.gameConfig || !state.currentRoundConfig) {
    return null;
  }

  switch (state.currentRoundConfig.minigame) {
    case "TRIVIA":
      return state.gameConfig.timers.triviaSeconds;
    case "GEO":
      return state.gameConfig.timers.geoSeconds;
    case "DRAWING":
      return state.gameConfig.timers.drawingSeconds;
    default:
      return null;
  }
};

export const isSetupReadyToStart = (state: RoomState): boolean => {
  if (state.gameConfig === null) {
    return false;
  }

  if (state.players.length === 0) {
    return false;
  }

  if (state.teams.length < 2) {
    return false;
  }

  const playerIds = new Set(state.players.map((player) => player.id));
  const assignedPlayerIds = new Set<string>();

  for (const team of state.teams) {
    if (team.playerIds.length === 0) {
      return false;
    }

    for (const playerId of team.playerIds) {
      if (!playerIds.has(playerId)) {
        return false;
      }

      if (assignedPlayerIds.has(playerId)) {
        return false;
      }

      assignedPlayerIds.add(playerId);
    }
  }

  return assignedPlayerIds.size === playerIds.size;
};
