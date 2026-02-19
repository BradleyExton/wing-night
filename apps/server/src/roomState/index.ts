import {
  Phase,
  type GameConfigFile,
  type Player,
  type RoomFatalError,
  type RoomState,
  type TriviaPrompt
} from "@wingnight/shared";

import {
  logManualScoreAdjustment,
  logPhaseTransition
} from "../logger/index.js";
import {
  captureTriviaRuntimeStateSnapshot,
  clearTriviaRuntimeState,
  initializeTriviaRuntimeState,
  reduceTriviaAttempt,
  resetTriviaRuntimeState,
  restoreTriviaRuntimeStateSnapshot,
  syncTriviaRuntimeWithPendingPoints,
  syncTriviaRuntimeWithPrompts,
  type TriviaRuntimeStateSnapshot
} from "../minigames/triviaRuntime/index.js";
import { getNextPhase } from "../utils/getNextPhase/index.js";
import { isRoomInFatalState } from "./guards/index.js";
import {
  applyPendingRoundScoresToTotals,
  arePointsByTeamIdEqual,
  clearPendingRoundScores,
  recomputePendingWingPoints,
  resetRoundWingParticipation,
  resolveTeamIdByPlayerId
} from "./scoringState/index.js";
import {
  isSetupReadyToStart,
  isTriviaMinigamePlayState,
  resolveCurrentRoundConfig,
  resolveMinigamePointsMax,
  resolveMinigameTimerSeconds,
  resolveTriviaQuestionsPerTurn
} from "./roundStateSelectors/index.js";
import {
  finalizeActiveRoundTurn,
  hasNextRoundTurn,
  initializeRoundTurnState,
  isExactTeamIdSet
} from "./teamTurnState/index.js";
import {
  createEatingTimerFromConfig,
  createRunningTimer,
  extendRoomTimerMutation,
  pauseRoomTimerMutation,
  resumeRoomTimerMutation
} from "./timerState/index.js";

const DEFAULT_TOTAL_ROUNDS = 3;

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

// This module-scoped state is intentionally single-process for the MVP.
// If the server is scaled across workers/processes, migrate to shared storage.
const roomState = createInitialRoomState();
type ScoringMutationUndoSnapshot = {
  round: number;
  teamTotalScoreById: Record<string, number>;
  wingParticipationByPlayerId: Record<string, boolean>;
  pendingWingPointsByTeamId: Record<string, number>;
  pendingMinigamePointsByTeamId: Record<string, number>;
  triviaRuntimeSnapshot: TriviaRuntimeStateSnapshot;
};
let scoringMutationUndoSnapshot: ScoringMutationUndoSnapshot | null = null;

const overwriteRoomState = (nextState: RoomState): void => {
  Object.assign(roomState, nextState);
};

const clearScoringMutationUndoState = (state: RoomState): void => {
  scoringMutationUndoSnapshot = null;
  state.canRedoScoringMutation = false;
};

const captureTeamTotalScoreById = (
  state: RoomState
): Record<string, number> => {
  const teamTotalScoreById: Record<string, number> = {};

  for (const team of state.teams) {
    teamTotalScoreById[team.id] = team.totalScore;
  }

  return teamTotalScoreById;
};

const createScoringMutationUndoSnapshot = (
  state: RoomState
): ScoringMutationUndoSnapshot => {
  return {
    round: state.currentRound,
    teamTotalScoreById: captureTeamTotalScoreById(state),
    wingParticipationByPlayerId: structuredClone(state.wingParticipationByPlayerId),
    pendingWingPointsByTeamId: structuredClone(state.pendingWingPointsByTeamId),
    pendingMinigamePointsByTeamId: structuredClone(state.pendingMinigamePointsByTeamId),
    triviaRuntimeSnapshot: captureTriviaRuntimeStateSnapshot()
  };
};

const captureScoringMutationUndoState = (state: RoomState): void => {
  scoringMutationUndoSnapshot = createScoringMutationUndoSnapshot(state);
};

const restoreScoringMutationUndoState = (
  state: RoomState,
  snapshot: ScoringMutationUndoSnapshot
): void => {
  for (const team of state.teams) {
    const snapshotScore = snapshot.teamTotalScoreById[team.id];

    if (typeof snapshotScore === "number") {
      team.totalScore = snapshotScore;
    }
  }

  state.wingParticipationByPlayerId = structuredClone(
    snapshot.wingParticipationByPlayerId
  );
  state.pendingWingPointsByTeamId = structuredClone(
    snapshot.pendingWingPointsByTeamId
  );
  state.pendingMinigamePointsByTeamId = structuredClone(
    snapshot.pendingMinigamePointsByTeamId
  );
  restoreTriviaRuntimeStateSnapshot(state, snapshot.triviaRuntimeSnapshot);
};

export const getRoomStateSnapshot = (): RoomState => {
  const snapshot = structuredClone(roomState);
  snapshot.canAdvancePhase = resolveCanAdvancePhase(roomState);

  return snapshot;
};

export const resetRoomState = (): RoomState => {
  overwriteRoomState(createInitialRoomState());
  resetTriviaRuntimeState();
  clearScoringMutationUndoState(roomState);

  return getRoomStateSnapshot();
};

export const resetGameToSetup = (): RoomState => {
  return runRoomMutation(() => {
    const preservedPlayers = structuredClone(roomState.players);
    const preservedGameConfig = structuredClone(roomState.gameConfig);
    const preservedTriviaPrompts = structuredClone(roomState.triviaPrompts);
    const nextState = createInitialRoomState();

    nextState.players = preservedPlayers;
    nextState.gameConfig = preservedGameConfig;
    nextState.triviaPrompts = preservedTriviaPrompts;
    nextState.totalRounds =
      preservedGameConfig === null
        ? nextState.totalRounds
        : preservedGameConfig.rounds.length;
    nextState.currentRoundConfig = null;

    overwriteRoomState(nextState);
    resetTriviaRuntimeState();
    clearScoringMutationUndoState(roomState);

    return getRoomStateSnapshot();
  });
};

export const setRoomStateFatalError = (message: string): RoomState => {
  overwriteRoomState(createInitialRoomState());
  resetTriviaRuntimeState();
  clearScoringMutationUndoState(roomState);

  const normalizedMessage =
    message.trim().length > 0
      ? message.trim()
      : "Unable to load content. Check local and sample content files.";

  const fatalError: RoomFatalError = {
    code: "CONTENT_LOAD_FAILED",
    message: normalizedMessage
  };

  roomState.fatalError = fatalError;

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

  initializeTriviaRuntimeState(
    state,
    minigamePointsMax,
    resolveTriviaQuestionsPerTurn(state)
  );
};

const runRoomMutation = (mutate: () => RoomState): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  return mutate();
};

const resolveNextPhase = (state: RoomState, previousPhase: Phase): Phase => {
  if (previousPhase === Phase.MINIGAME_PLAY) {
    return hasNextRoundTurn(state) ? Phase.EATING : Phase.ROUND_RESULTS;
  }

  return getNextPhase(previousPhase, state.currentRound, state.totalRounds);
};

const applySkipTurnBoundaryTimerState = (
  state: RoomState,
  nextPhase: Phase
): void => {
  state.timer = nextPhase === Phase.EATING ? createEatingTimerFromConfig(state) : null;
};

const applyAdvancePhaseRuntimeAndScoringEffects = (
  state: RoomState,
  previousPhase: Phase,
  nextPhase: Phase
): void => {
  if (nextPhase === Phase.ROUND_INTRO) {
    initializeRoundTurnState(state);
  }

  if (previousPhase === Phase.MINIGAME_INTRO && nextPhase === Phase.MINIGAME_PLAY) {
    initializeActiveMinigameTurnState(state);
  }

  if (previousPhase === Phase.MINIGAME_PLAY && nextPhase !== Phase.MINIGAME_PLAY) {
    clearTriviaRuntimeState(state);
  }

  if (previousPhase === Phase.MINIGAME_PLAY && nextPhase === Phase.ROUND_RESULTS) {
    clearScoringMutationUndoState(state);
    applyPendingRoundScoresToTotals(state);
  }

  if (previousPhase === Phase.ROUND_RESULTS) {
    clearPendingRoundScores(state);
  }
};

const applyAdvancePhaseTimerState = (
  state: RoomState,
  previousPhase: Phase,
  nextPhase: Phase
): void => {
  const isEatingTransition =
    (previousPhase === Phase.ROUND_INTRO && nextPhase === Phase.EATING) ||
    (previousPhase === Phase.MINIGAME_PLAY && nextPhase === Phase.EATING);

  if (isEatingTransition) {
    if (previousPhase === Phase.ROUND_INTRO) {
      resetRoundWingParticipation(state);
    }

    state.timer = createEatingTimerFromConfig(state);
    return;
  }

  if (nextPhase === Phase.MINIGAME_PLAY) {
    const minigameSeconds = resolveMinigameTimerSeconds(state);
    state.timer =
      minigameSeconds === null
        ? null
        : createRunningTimer(Phase.MINIGAME_PLAY, minigameSeconds);
    return;
  }

  state.timer = null;
};

export const createTeam = (name: string): RoomState => {
  return runRoomMutation(() => {
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
  });
};

export const assignPlayerToTeam = (
  playerId: string,
  teamId: string | null
): RoomState => {
  return runRoomMutation(() => {
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
  });
};

export const reorderTurnOrder = (teamIds: string[]): RoomState => {
  return runRoomMutation(() => {
    if (roomState.phase !== Phase.ROUND_INTRO) {
      return getRoomStateSnapshot();
    }

    if (
      !Array.isArray(teamIds) ||
      !teamIds.every((teamId) => typeof teamId === "string")
    ) {
      return getRoomStateSnapshot();
    }

    if (!isExactTeamIdSet(teamIds, roomState.teams)) {
      return getRoomStateSnapshot();
    }

    roomState.turnOrderTeamIds = [...teamIds];
    roomState.roundTurnCursor = teamIds.length > 0 ? 0 : -1;
    roomState.completedRoundTurnTeamIds = [];
    roomState.activeRoundTeamId =
      roomState.roundTurnCursor === -1
        ? null
        : roomState.turnOrderTeamIds[roomState.roundTurnCursor] ?? null;

    return getRoomStateSnapshot();
  });
};

export const setWingParticipation = (
  playerId: string,
  didEat: boolean
): RoomState => {
  return runRoomMutation(() => {
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

    if (roomState.wingParticipationByPlayerId[playerId] === didEat) {
      return getRoomStateSnapshot();
    }

    captureScoringMutationUndoState(roomState);
    roomState.wingParticipationByPlayerId[playerId] = didEat;
    recomputePendingWingPoints(roomState);
    roomState.canRedoScoringMutation = true;

    return getRoomStateSnapshot();
  });
};

export const adjustTeamScore = (teamId: string, delta: number): RoomState => {
  return runRoomMutation(() => {
    if (roomState.phase === Phase.SETUP) {
      return getRoomStateSnapshot();
    }

    if (!Number.isInteger(delta) || delta === 0) {
      return getRoomStateSnapshot();
    }

    const targetTeam = roomState.teams.find((team) => team.id === teamId);

    if (!targetTeam) {
      return getRoomStateSnapshot();
    }

    const nextTotalScore = targetTeam.totalScore + delta;

    if (nextTotalScore < 0) {
      return getRoomStateSnapshot();
    }

    captureScoringMutationUndoState(roomState);
    targetTeam.totalScore = nextTotalScore;
    roomState.canRedoScoringMutation = true;
    logManualScoreAdjustment(
      targetTeam.id,
      delta,
      targetTeam.totalScore,
      roomState.currentRound,
      roomState.phase
    );

    return getRoomStateSnapshot();
  });
};

export const setPendingMinigamePoints = (
  pointsByTeamId: Record<string, number>
): RoomState => {
  return runRoomMutation(() => {
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

    if (
      arePointsByTeamIdEqual(
        roomState.pendingMinigamePointsByTeamId,
        nextPendingMinigamePointsByTeamId
      )
    ) {
      return getRoomStateSnapshot();
    }

    captureScoringMutationUndoState(roomState);
    roomState.pendingMinigamePointsByTeamId = nextPendingMinigamePointsByTeamId;
    roomState.canRedoScoringMutation = true;

    if (isTriviaMinigamePlayState(roomState)) {
      syncTriviaRuntimeWithPendingPoints(
        roomState,
        nextPendingMinigamePointsByTeamId
      );
    }

    return getRoomStateSnapshot();
  });
};

export const recordTriviaAttempt = (isCorrect: boolean): RoomState => {
  return runRoomMutation(() => {
    if (!isTriviaMinigamePlayState(roomState)) {
      return getRoomStateSnapshot();
    }

    const minigamePointsMax = resolveMinigamePointsMax(roomState);

    if (minigamePointsMax === null) {
      return getRoomStateSnapshot();
    }

    const questionsPerTurn = resolveTriviaQuestionsPerTurn(roomState);
    const nextUndoSnapshot = createScoringMutationUndoSnapshot(roomState);
    const didRecordAttempt = reduceTriviaAttempt(
      roomState,
      isCorrect,
      minigamePointsMax,
      questionsPerTurn
    );

    if (!didRecordAttempt) {
      return getRoomStateSnapshot();
    }

    scoringMutationUndoSnapshot = nextUndoSnapshot;
    roomState.canRedoScoringMutation = true;

    return getRoomStateSnapshot();
  });
};

export const redoLastScoringMutation = (): RoomState => {
  return runRoomMutation(() => {
    if (scoringMutationUndoSnapshot === null) {
      return getRoomStateSnapshot();
    }

    if (scoringMutationUndoSnapshot.round !== roomState.currentRound) {
      clearScoringMutationUndoState(roomState);
      return getRoomStateSnapshot();
    }

    const snapshotToRestore = scoringMutationUndoSnapshot;
    restoreScoringMutationUndoState(roomState, snapshotToRestore);
    clearScoringMutationUndoState(roomState);

    return getRoomStateSnapshot();
  });
};

export const pauseRoomTimer = (): RoomState => {
  return runRoomMutation(() => {
    pauseRoomTimerMutation(roomState);
    return getRoomStateSnapshot();
  });
};

export const resumeRoomTimer = (): RoomState => {
  return runRoomMutation(() => {
    resumeRoomTimerMutation(roomState);
    return getRoomStateSnapshot();
  });
};

export const extendRoomTimer = (additionalSeconds: number): RoomState => {
  return runRoomMutation(() => {
    extendRoomTimerMutation(roomState, additionalSeconds);
    return getRoomStateSnapshot();
  });
};

export const skipTurnBoundary = (): RoomState => {
  return runRoomMutation(() => {
    const previousPhase = roomState.phase;
    const canSkipTurn =
      previousPhase === Phase.EATING ||
      previousPhase === Phase.MINIGAME_INTRO ||
      previousPhase === Phase.MINIGAME_PLAY;

    if (!canSkipTurn) {
      return getRoomStateSnapshot();
    }

    const shouldAdvanceToNextTeam = hasNextRoundTurn(roomState);
    finalizeActiveRoundTurn(roomState);

    const nextPhase = shouldAdvanceToNextTeam ? Phase.EATING : Phase.ROUND_RESULTS;
    roomState.phase = nextPhase;
    roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

    if (previousPhase === Phase.MINIGAME_PLAY) {
      clearTriviaRuntimeState(roomState);
    }

    if (nextPhase === Phase.ROUND_RESULTS) {
      clearScoringMutationUndoState(roomState);
      applyPendingRoundScoresToTotals(roomState);
    }

    applySkipTurnBoundaryTimerState(roomState, nextPhase);

    logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

    return getRoomStateSnapshot();
  });
};

export const advanceRoomStatePhase = (): RoomState => {
  return runRoomMutation(() => {
    const previousPhase = roomState.phase;
    const previousRound = roomState.currentRound;

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

    roomState.currentRoundConfig =
      nextPhase === Phase.FINAL_RESULTS ? null : resolveCurrentRoundConfig(roomState);

    applyAdvancePhaseRuntimeAndScoringEffects(roomState, previousPhase, nextPhase);
    applyAdvancePhaseTimerState(roomState, previousPhase, nextPhase);

    if (roomState.currentRound !== previousRound) {
      clearScoringMutationUndoState(roomState);
    }

    logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

    return getRoomStateSnapshot();
  });
};

const resolveCanAdvancePhase = (state: RoomState): boolean => {
  if (isRoomInFatalState(state)) {
    return false;
  }

  if (state.phase === Phase.FINAL_RESULTS) {
    return false;
  }

  if (state.phase === Phase.SETUP) {
    return isSetupReadyToStart(state);
  }

  return true;
};
