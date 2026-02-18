import {
  Phase,
  type GameConfigFile,
  type Player,
  type RoomState,
  type TriviaPrompt
} from "@wingnight/shared";

import { logPhaseTransition, logScoreMutation } from "../logger/index.js";
import {
  clearTriviaRuntimeState,
  initializeTriviaRuntimeState,
  reduceTriviaAttempt,
  resetTriviaRuntimeState,
  syncTriviaRuntimeWithPendingPoints,
  syncTriviaRuntimeWithPrompts
} from "../minigames/triviaRuntime/index.js";
import { getNextPhase } from "../utils/getNextPhase/index.js";

const DEFAULT_TOTAL_ROUNDS = 3;

const resolveCurrentRoundConfig = (state: RoomState): RoomState["currentRoundConfig"] => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  return state.gameConfig.rounds[state.currentRound - 1] ?? null;
};

const isTriviaMinigamePlayState = (state: RoomState): boolean => {
  return (
    state.phase === Phase.MINIGAME_PLAY &&
    state.currentRoundConfig?.minigame === "TRIVIA"
  );
};

const resolveMinigamePointsMax = (state: RoomState): number | null => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  if (state.currentRound === state.totalRounds) {
    return state.gameConfig.minigameScoring.finalRoundMax;
  }

  return state.gameConfig.minigameScoring.defaultMax;
};

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    players: [],
    teams: [],
    gameConfig: null,
    triviaPrompts: [],
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
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
  resetTriviaRuntimeState();

  return getRoomStateSnapshot();
};

export const setRoomStatePlayers = (players: Player[]): RoomState => {
  roomState.players = structuredClone(players);

  return getRoomStateSnapshot();
};

export const setRoomStateGameConfig = (
  gameConfig: GameConfigFile
): RoomState => {
  roomState.gameConfig = structuredClone(gameConfig);
  roomState.totalRounds = gameConfig.rounds.length;
  roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

  return getRoomStateSnapshot();
};

export const setRoomStateTriviaPrompts = (
  triviaPrompts: TriviaPrompt[]
): RoomState => {
  roomState.triviaPrompts = structuredClone(triviaPrompts);
  syncTriviaRuntimeWithPrompts(roomState);

  return getRoomStateSnapshot();
};

const initializeActiveMinigameTurnState = (state: RoomState): void => {
  const minigameType = state.currentRoundConfig?.minigame;

  if (minigameType !== "TRIVIA") {
    clearTriviaRuntimeState(state);
    return;
  }

  const minigamePointsMax = resolveMinigamePointsMax(state);

  if (minigamePointsMax === null) {
    clearTriviaRuntimeState(state);
    return;
  }

  initializeTriviaRuntimeState(state, minigamePointsMax);
};

const recomputePendingWingPoints = (state: RoomState): void => {
  if (!state.currentRoundConfig) {
    state.pendingWingPointsByTeamId = {};
    return;
  }

  const pointsPerPlayer = state.currentRoundConfig.pointsPerPlayer;
  const nextPendingPointsByTeamId: Record<string, number> = {};

  for (const team of state.teams) {
    const ateCount = team.playerIds.reduce((count, playerId) => {
      return state.wingParticipationByPlayerId[playerId] === true ? count + 1 : count;
    }, 0);

    nextPendingPointsByTeamId[team.id] = ateCount * pointsPerPlayer;
  }

  state.pendingWingPointsByTeamId = nextPendingPointsByTeamId;
};

const resetRoundWingParticipation = (state: RoomState): void => {
  state.wingParticipationByPlayerId = {};
  state.pendingWingPointsByTeamId = {};
};

const clearPendingRoundScores = (state: RoomState): void => {
  state.pendingWingPointsByTeamId = {};
  state.pendingMinigamePointsByTeamId = {};
};

const resolveTeamIdByPlayerId = (
  state: RoomState,
  playerId: string
): string | null => {
  for (const team of state.teams) {
    if (team.playerIds.includes(playerId)) {
      return team.id;
    }
  }

  return null;
};

const ensureTurnOrderTeamIds = (state: RoomState): void => {
  if (state.turnOrderTeamIds.length > 0) {
    return;
  }

  state.turnOrderTeamIds = state.teams.map((team) => team.id);
};

const initializeRoundTurnState = (state: RoomState): void => {
  ensureTurnOrderTeamIds(state);
  state.roundTurnCursor = state.turnOrderTeamIds.length > 0 ? 0 : -1;
  state.completedRoundTurnTeamIds = [];
  state.activeRoundTeamId =
    state.roundTurnCursor === -1
      ? null
      : state.turnOrderTeamIds[state.roundTurnCursor] ?? null;
};

const finalizeActiveRoundTurn = (state: RoomState): void => {
  const activeRoundTeamId = state.activeRoundTeamId;

  if (activeRoundTeamId !== null) {
    state.completedRoundTurnTeamIds = [
      ...state.completedRoundTurnTeamIds,
      activeRoundTeamId
    ];
  }

  const nextRoundTurnCursor = state.roundTurnCursor + 1;
  const hasNextRoundTurn = nextRoundTurnCursor < state.turnOrderTeamIds.length;

  if (!hasNextRoundTurn) {
    return;
  }

  state.roundTurnCursor = nextRoundTurnCursor;
  state.activeRoundTeamId = state.turnOrderTeamIds[nextRoundTurnCursor] ?? null;
};

const resolveNextPhase = (state: RoomState, previousPhase: Phase): Phase => {
  if (previousPhase === Phase.MINIGAME_PLAY) {
    const hasNextRoundTurn =
      state.roundTurnCursor + 1 < state.turnOrderTeamIds.length;

    return hasNextRoundTurn ? Phase.EATING : Phase.ROUND_RESULTS;
  }

  return getNextPhase(previousPhase, state.currentRound, state.totalRounds);
};

export const createTeam = (name: string): RoomState => {
  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    return getRoomStateSnapshot();
  }

  const nextTeamIndex = roomState.teams.length + 1;
  roomState.teams.push({
    id: `team-${nextTeamIndex}`,
    name: normalizedName,
    playerIds: [],
    totalScore: 0
  });

  return getRoomStateSnapshot();
};

export const assignPlayerToTeam = (
  playerId: string,
  teamId: string | null
): RoomState => {
  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  const playerExists = roomState.players.some((player) => player.id === playerId);

  if (!playerExists) {
    return getRoomStateSnapshot();
  }

  if (teamId !== null && !roomState.teams.some((team) => team.id === teamId)) {
    return getRoomStateSnapshot();
  }

  for (const team of roomState.teams) {
    team.playerIds = team.playerIds.filter((id) => id !== playerId);
  }

  if (teamId === null) {
    return getRoomStateSnapshot();
  }

  const targetTeam = roomState.teams.find((team) => team.id === teamId);

  if (!targetTeam) {
    return getRoomStateSnapshot();
  }

  targetTeam.playerIds.push(playerId);

  return getRoomStateSnapshot();
};

export const setWingParticipation = (
  playerId: string,
  didEat: boolean
): RoomState => {
  if (roomState.phase !== Phase.EATING) {
    return getRoomStateSnapshot();
  }

  if (!roomState.currentRoundConfig) {
    return getRoomStateSnapshot();
  }

  const playerExists = roomState.players.some((player) => player.id === playerId);

  if (!playerExists) {
    return getRoomStateSnapshot();
  }

  const playerTeamId = resolveTeamIdByPlayerId(roomState, playerId);

  if (playerTeamId === null) {
    return getRoomStateSnapshot();
  }

  if (
    roomState.activeRoundTeamId === null ||
    playerTeamId !== roomState.activeRoundTeamId
  ) {
    return getRoomStateSnapshot();
  }

  roomState.wingParticipationByPlayerId[playerId] = didEat;
  recomputePendingWingPoints(roomState);

  return getRoomStateSnapshot();
};

export const setPendingMinigamePoints = (
  pointsByTeamId: Record<string, number>
): RoomState => {
  if (roomState.phase !== Phase.MINIGAME_PLAY) {
    return getRoomStateSnapshot();
  }

  const minigamePointsMax = resolveMinigamePointsMax(roomState);

  if (minigamePointsMax === null) {
    return getRoomStateSnapshot();
  }

  const activeRoundTeamId = roomState.activeRoundTeamId;

  if (activeRoundTeamId === null) {
    return getRoomStateSnapshot();
  }

  for (const teamId of Object.keys(pointsByTeamId)) {
    if (teamId !== activeRoundTeamId) {
      return getRoomStateSnapshot();
    }
  }

  const nextPoints = pointsByTeamId[activeRoundTeamId] ?? 0;

  if (
    !Number.isFinite(nextPoints) ||
    nextPoints < 0 ||
    nextPoints > minigamePointsMax
  ) {
    return getRoomStateSnapshot();
  }

  const nextPendingMinigamePointsByTeamId: Record<string, number> = {
    ...roomState.pendingMinigamePointsByTeamId,
    [activeRoundTeamId]: nextPoints
  };

  for (const team of roomState.teams) {
    if (nextPendingMinigamePointsByTeamId[team.id] === undefined) {
      nextPendingMinigamePointsByTeamId[team.id] = 0;
    }
  }

  roomState.pendingMinigamePointsByTeamId = nextPendingMinigamePointsByTeamId;

  if (isTriviaMinigamePlayState(roomState)) {
    syncTriviaRuntimeWithPendingPoints(
      roomState,
      nextPendingMinigamePointsByTeamId
    );
  }

  return getRoomStateSnapshot();
};

export const recordTriviaAttempt = (isCorrect: boolean): RoomState => {
  if (!isTriviaMinigamePlayState(roomState)) {
    return getRoomStateSnapshot();
  }

  const minigamePointsMax = resolveMinigamePointsMax(roomState);

  if (minigamePointsMax === null) {
    return getRoomStateSnapshot();
  }

  reduceTriviaAttempt(roomState, isCorrect, minigamePointsMax);

  return getRoomStateSnapshot();
};

const isSetupReadyToStart = (state: RoomState): boolean => {
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

export const advanceRoomStatePhase = (): RoomState => {
  const previousPhase = roomState.phase;

  if (previousPhase === Phase.SETUP && !isSetupReadyToStart(roomState)) {
    return getRoomStateSnapshot();
  }

  const nextPhase = resolveNextPhase(roomState, previousPhase);

  if (previousPhase === Phase.MINIGAME_PLAY) {
    finalizeActiveRoundTurn(roomState);
  }

  roomState.phase = nextPhase;

  if (
    previousPhase === Phase.INTRO &&
    nextPhase === Phase.ROUND_INTRO &&
    roomState.currentRound === 0
  ) {
    roomState.currentRound = 1;
  }

  if (previousPhase === Phase.ROUND_RESULTS && nextPhase === Phase.ROUND_INTRO) {
    roomState.currentRound += 1;
  }

  if (nextPhase === Phase.FINAL_RESULTS) {
    roomState.currentRoundConfig = null;
  } else {
    roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);
  }

  if (nextPhase === Phase.ROUND_INTRO) {
    initializeRoundTurnState(roomState);
  }

  if (previousPhase === Phase.MINIGAME_INTRO && nextPhase === Phase.MINIGAME_PLAY) {
    initializeActiveMinigameTurnState(roomState);
  }

  if (previousPhase === Phase.MINIGAME_PLAY && nextPhase !== Phase.MINIGAME_PLAY) {
    clearTriviaRuntimeState(roomState);
  }

  if (previousPhase === Phase.MINIGAME_PLAY && nextPhase === Phase.ROUND_RESULTS) {
    for (const team of roomState.teams) {
      const wingPoints = roomState.pendingWingPointsByTeamId[team.id] ?? 0;
      const minigamePoints = roomState.pendingMinigamePointsByTeamId[team.id] ?? 0;
      const roundPoints = wingPoints + minigamePoints;

      if (roundPoints === 0) {
        continue;
      }

      team.totalScore += roundPoints;
      logScoreMutation(
        team.id,
        roomState.currentRound,
        wingPoints,
        minigamePoints,
        team.totalScore
      );
    }
  }

  if (previousPhase === Phase.ROUND_RESULTS) {
    clearPendingRoundScores(roomState);
  }

  if (previousPhase === Phase.ROUND_INTRO && nextPhase === Phase.EATING) {
    resetRoundWingParticipation(roomState);
  }

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};
