import {
  createTriviaStateWithPendingPoints,
  isTriviaMinigameState,
  type TriviaMinigameAction,
  type TriviaMinigameContext,
  type TriviaMinigameState
} from "@wingnight/minigames-trivia";
import { Phase, type RoomState } from "@wingnight/shared";

import { resolveMinigameModule } from "../registry/index.js";
import {
  clearTriviaProjectionFromRoomState,
  projectTriviaHostViewToRoomState
} from "../triviaProjection/index.js";

const triviaModule = resolveMinigameModule("TRIVIA");

let triviaRuntimeState: TriviaMinigameState | null = null;

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
  projectTriviaHostViewToRoomState(state, hostView);
};

const resolveActiveTriviaRuntimeState = (): TriviaMinigameState | null => {
  if (triviaRuntimeState === null || !isTriviaMinigameState(triviaRuntimeState)) {
    return null;
  }

  return triviaRuntimeState;
};

export const resetTriviaRuntimeState = (): void => {
  triviaRuntimeState = null;
};

export const initializeTriviaRuntimeState = (
  state: RoomState,
  pointsMax: number
): void => {
  if (!triviaModule) {
    clearTriviaProjectionFromRoomState(state);
    triviaRuntimeState = null;
    return;
  }

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
  pointsMax: number
): TriviaMinigameState | null => {
  const currentRuntimeState = resolveActiveTriviaRuntimeState();

  if (currentRuntimeState !== null) {
    return currentRuntimeState;
  }

  initializeTriviaRuntimeState(state, pointsMax);

  return resolveActiveTriviaRuntimeState();
};

export const reduceTriviaAttempt = (
  state: RoomState,
  isCorrect: boolean,
  pointsMax: number
): void => {
  if (!triviaModule || !isTriviaMinigamePlayState(state)) {
    return;
  }

  const currentRuntimeState = ensureTriviaRuntimeState(state, pointsMax);

  if (currentRuntimeState === null) {
    return;
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
  projectTriviaRuntimeStateToRoomState(state, nextTriviaRuntimeState);
};
