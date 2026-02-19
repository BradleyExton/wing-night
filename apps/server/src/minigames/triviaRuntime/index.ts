import {
  createTriviaStateWithPendingPoints,
  isTriviaMinigameState,
  triviaMinigameModule,
  type TriviaMinigameAction,
  type TriviaMinigameContext,
  type TriviaMinigameState
} from "@wingnight/minigames-trivia";
import { Phase, type RoomState } from "@wingnight/shared";
import {
  clearTriviaProjectionFromRoomState,
  projectTriviaDisplayViewToRoomState,
  projectTriviaHostViewToRoomState
} from "../triviaProjection/index.js";

const triviaModule = triviaMinigameModule;
const DEFAULT_TRIVIA_QUESTIONS_PER_TURN = 1;

let triviaRuntimeState: TriviaMinigameState | null = null;
let triviaAttemptsUsedThisTurn = 0;
let triviaQuestionsPerTurnLimit = DEFAULT_TRIVIA_QUESTIONS_PER_TURN;

type TriviaRuntimeStateSnapshotState = {
  runtimeState: TriviaMinigameState | null;
  attemptsUsedThisTurn: number;
  questionsPerTurnLimit: number;
};

export type TriviaRuntimeStateSnapshot = TriviaRuntimeStateSnapshotState | null;

const resolveTriviaMinigameContext = (state: RoomState): TriviaMinigameContext => {
  return {
    prompts: state.triviaPrompts
  };
};

const isTriviaMinigamePlayState = (state: RoomState): boolean => {
  return (
    state.phase === Phase.MINIGAME_PLAY &&
    state.currentRoundConfig?.minigame === "TRIVIA"
  );
};

const normalizeTriviaQuestionsPerTurn = (questionsPerTurn: number): number => {
  if (!Number.isInteger(questionsPerTurn) || questionsPerTurn <= 0) {
    return DEFAULT_TRIVIA_QUESTIONS_PER_TURN;
  }

  return questionsPerTurn;
};

const resetTriviaAttemptLimitState = (): void => {
  triviaAttemptsUsedThisTurn = 0;
  triviaQuestionsPerTurnLimit = DEFAULT_TRIVIA_QUESTIONS_PER_TURN;
};

const applyTriviaQuestionsPerTurnLimit = (questionsPerTurn: number): void => {
  const normalizedLimit = normalizeTriviaQuestionsPerTurn(questionsPerTurn);
  triviaQuestionsPerTurnLimit = normalizedLimit;
  triviaAttemptsUsedThisTurn = Math.min(triviaAttemptsUsedThisTurn, normalizedLimit);
};

const resolveTriviaAttemptsRemaining = (): number => {
  return Math.max(0, triviaQuestionsPerTurnLimit - triviaAttemptsUsedThisTurn);
};

const resolveTriviaAttemptsRemainingForLimit = (
  questionsPerTurn: number
): number => {
  const normalizedLimit = normalizeTriviaQuestionsPerTurn(questionsPerTurn);
  const normalizedAttemptsUsed = Math.max(
    0,
    Math.min(triviaAttemptsUsedThisTurn, normalizedLimit)
  );

  return Math.max(0, normalizedLimit - normalizedAttemptsUsed);
};

const projectTriviaRuntimeStateToRoomState = (
  state: RoomState,
  currentTriviaRuntimeState: TriviaMinigameState
): void => {
  if (!triviaModule) {
    return;
  }

  const hostView = triviaModule.selectHostView({
    state: currentTriviaRuntimeState,
    context: resolveTriviaMinigameContext(state)
  });
  const displayView = triviaModule.selectDisplayView({
    state: currentTriviaRuntimeState,
    context: resolveTriviaMinigameContext(state)
  });

  projectTriviaHostViewToRoomState(
    state,
    hostView,
    resolveTriviaAttemptsRemaining()
  );
  projectTriviaDisplayViewToRoomState(state, displayView);
};

const resolveActiveTriviaRuntimeState = (): TriviaMinigameState | null => {
  if (triviaRuntimeState === null || !isTriviaMinigameState(triviaRuntimeState)) {
    return null;
  }

  return triviaRuntimeState;
};

export const getTriviaAttemptsRemaining = (): number => {
  return resolveTriviaAttemptsRemaining();
};

export const canReduceTriviaAttempt = (
  state: RoomState,
  questionsPerTurn: number
): boolean => {
  if (!triviaModule || !isTriviaMinigamePlayState(state)) {
    return false;
  }

  const currentRuntimeState = resolveActiveTriviaRuntimeState();

  if (currentRuntimeState !== null) {
    if (currentRuntimeState.turnOrderTeamIds.length === 0) {
      return false;
    }

    if (
      currentRuntimeState.activeTurnIndex < 0 ||
      currentRuntimeState.activeTurnIndex >= currentRuntimeState.turnOrderTeamIds.length
    ) {
      return false;
    }
  } else if (state.turnOrderTeamIds.length === 0) {
    return false;
  }

  return resolveTriviaAttemptsRemainingForLimit(questionsPerTurn) > 0;
};

export const captureTriviaRuntimeStateSnapshot = (): TriviaRuntimeStateSnapshot => {
  const currentRuntimeState = resolveActiveTriviaRuntimeState();

  return {
    runtimeState:
      currentRuntimeState === null ? null : structuredClone(currentRuntimeState),
    attemptsUsedThisTurn: triviaAttemptsUsedThisTurn,
    questionsPerTurnLimit: triviaQuestionsPerTurnLimit
  };
};

export const restoreTriviaRuntimeStateSnapshot = (
  state: RoomState,
  snapshot: TriviaRuntimeStateSnapshot
): void => {
  if (snapshot === null) {
    clearTriviaProjectionFromRoomState(state);
    triviaRuntimeState = null;
    resetTriviaAttemptLimitState();
    return;
  }

  if (
    snapshot.runtimeState === null ||
    !isTriviaMinigamePlayState(state) ||
    !triviaModule
  ) {
    clearTriviaProjectionFromRoomState(state);
    triviaRuntimeState = null;
    resetTriviaAttemptLimitState();
    return;
  }

  triviaRuntimeState = structuredClone(snapshot.runtimeState);
  triviaQuestionsPerTurnLimit = normalizeTriviaQuestionsPerTurn(
    snapshot.questionsPerTurnLimit
  );
  triviaAttemptsUsedThisTurn = Number.isInteger(snapshot.attemptsUsedThisTurn)
    ? Math.max(
        0,
        Math.min(snapshot.attemptsUsedThisTurn, triviaQuestionsPerTurnLimit)
      )
    : 0;
  projectTriviaRuntimeStateToRoomState(state, triviaRuntimeState);
};

export const resetTriviaRuntimeState = (): void => {
  triviaRuntimeState = null;
  resetTriviaAttemptLimitState();
};

export const initializeTriviaRuntimeState = (
  state: RoomState,
  pointsMax: number,
  questionsPerTurn: number
): void => {
  if (!triviaModule) {
    clearTriviaProjectionFromRoomState(state);
    triviaRuntimeState = null;
    resetTriviaAttemptLimitState();
    return;
  }

  applyTriviaQuestionsPerTurnLimit(questionsPerTurn);
  triviaAttemptsUsedThisTurn = 0;

  const activeRoundTeamId = state.activeRoundTeamId;
  const runtimeTeamIds =
    activeRoundTeamId === null ? state.turnOrderTeamIds : [activeRoundTeamId];
  const nextTriviaRuntimeState = createTriviaStateWithPendingPoints(
    triviaModule.init({
      teamIds: runtimeTeamIds,
      pointsMax,
      context: resolveTriviaMinigameContext(state)
    }),
    state.pendingMinigamePointsByTeamId
  );
  triviaRuntimeState = nextTriviaRuntimeState;
  projectTriviaRuntimeStateToRoomState(state, nextTriviaRuntimeState);
};

export const clearTriviaRuntimeState = (state: RoomState): void => {
  clearTriviaProjectionFromRoomState(state);
  triviaRuntimeState = null;
  resetTriviaAttemptLimitState();
};

export const syncTriviaRuntimeWithPrompts = (state: RoomState): void => {
  if (!isTriviaMinigamePlayState(state) || state.triviaPrompts.length === 0) {
    return;
  }

  const nextCursor = state.triviaPromptCursor % state.triviaPrompts.length;
  const currentRuntimeState = resolveActiveTriviaRuntimeState();

  if (currentRuntimeState !== null) {
    triviaRuntimeState = {
      turnOrderTeamIds: [...currentRuntimeState.turnOrderTeamIds],
      activeTurnIndex: currentRuntimeState.activeTurnIndex,
      promptCursor: nextCursor,
      pendingPointsByTeamId: { ...currentRuntimeState.pendingPointsByTeamId }
    };
    projectTriviaRuntimeStateToRoomState(state, triviaRuntimeState);
    return;
  }

  state.triviaPromptCursor = nextCursor;
  state.currentTriviaPrompt = state.triviaPrompts[nextCursor] ?? null;
};

export const syncTriviaRuntimeWithPendingPoints = (
  state: RoomState,
  pendingPointsByTeamId: Record<string, number>
): void => {
  if (!isTriviaMinigamePlayState(state)) {
    return;
  }

  const currentRuntimeState = resolveActiveTriviaRuntimeState();

  if (currentRuntimeState === null) {
    return;
  }

  triviaRuntimeState = createTriviaStateWithPendingPoints(
    currentRuntimeState,
    pendingPointsByTeamId
  );
  projectTriviaRuntimeStateToRoomState(state, triviaRuntimeState);
};

const ensureTriviaRuntimeState = (
  state: RoomState,
  pointsMax: number,
  questionsPerTurn: number
): TriviaMinigameState | null => {
  const currentRuntimeState = resolveActiveTriviaRuntimeState();

  if (currentRuntimeState !== null) {
    return currentRuntimeState;
  }

  initializeTriviaRuntimeState(state, pointsMax, questionsPerTurn);

  return resolveActiveTriviaRuntimeState();
};

export const reduceTriviaAttempt = (
  state: RoomState,
  isCorrect: boolean,
  pointsMax: number,
  questionsPerTurn: number
): boolean => {
  if (!canReduceTriviaAttempt(state, questionsPerTurn)) {
    return false;
  }

  if (!triviaModule) {
    return false;
  }

  applyTriviaQuestionsPerTurnLimit(questionsPerTurn);

  const currentRuntimeState = ensureTriviaRuntimeState(
    state,
    pointsMax,
    questionsPerTurn
  );

  if (currentRuntimeState === null || resolveTriviaAttemptsRemaining() <= 0) {
    return false;
  }

  const action: TriviaMinigameAction = {
    type: "recordAttempt",
    isCorrect
  };

  const nextTriviaRuntimeState = triviaModule.reduce({
    teamIds: state.turnOrderTeamIds,
    pointsMax,
    context: resolveTriviaMinigameContext(state),
    state: currentRuntimeState,
    action
  });

  triviaRuntimeState = nextTriviaRuntimeState;
  triviaAttemptsUsedThisTurn = Math.min(
    triviaQuestionsPerTurnLimit,
    triviaAttemptsUsedThisTurn + 1
  );
  projectTriviaRuntimeStateToRoomState(state, nextTriviaRuntimeState);

  return true;
};
