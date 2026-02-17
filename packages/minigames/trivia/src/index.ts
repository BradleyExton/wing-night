import type { MinigameModule, MinigameSelectorInput } from "@wingnight/minigames-core";
import type { TriviaPrompt } from "@wingnight/shared";

export type TriviaMinigameState = {
  turnOrderTeamIds: string[];
  activeTurnIndex: number;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
};

export type TriviaMinigameAction = {
  type: "recordAttempt";
  isCorrect: boolean;
};

export type TriviaMinigameContext = {
  prompts: TriviaPrompt[];
};

export type TriviaHostView = {
  activeTurnTeamId: string | null;
  promptCursor: number;
  currentPrompt: TriviaPrompt | null;
  pendingPointsByTeamId: Record<string, number>;
};

export type TriviaDisplayView = {
  activeTurnTeamId: string | null;
  promptCursor: number;
  currentPrompt: {
    id: string;
    question: string;
  } | null;
  pendingPointsByTeamId: Record<string, number>;
};

const clonePendingPoints = (
  pendingPointsByTeamId: Record<string, number>
): Record<string, number> => {
  return { ...pendingPointsByTeamId };
};

const resolveActiveTurnTeamId = (state: TriviaMinigameState): string | null => {
  if (state.turnOrderTeamIds.length === 0) {
    return null;
  }

  if (
    state.activeTurnIndex < 0 ||
    state.activeTurnIndex >= state.turnOrderTeamIds.length
  ) {
    return null;
  }

  return state.turnOrderTeamIds[state.activeTurnIndex] ?? null;
};

const resolveCurrentPrompt = (
  state: TriviaMinigameState,
  context: TriviaMinigameContext
): TriviaPrompt | null => {
  if (context.prompts.length === 0) {
    return null;
  }

  const promptIndex = state.promptCursor % context.prompts.length;
  return context.prompts[promptIndex] ?? null;
};

const selectHostView = (
  input: MinigameSelectorInput<TriviaMinigameState, TriviaMinigameContext>
): TriviaHostView => {
  const currentPrompt = resolveCurrentPrompt(input.state, input.context);

  return {
    activeTurnTeamId: resolveActiveTurnTeamId(input.state),
    promptCursor: input.state.promptCursor,
    currentPrompt,
    pendingPointsByTeamId: clonePendingPoints(input.state.pendingPointsByTeamId)
  };
};

const selectDisplayView = (
  input: MinigameSelectorInput<TriviaMinigameState, TriviaMinigameContext>
): TriviaDisplayView => {
  const currentPrompt = resolveCurrentPrompt(input.state, input.context);

  return {
    activeTurnTeamId: resolveActiveTurnTeamId(input.state),
    promptCursor: input.state.promptCursor,
    currentPrompt:
      currentPrompt === null
        ? null
        : {
            id: currentPrompt.id,
            question: currentPrompt.question
          },
    pendingPointsByTeamId: clonePendingPoints(input.state.pendingPointsByTeamId)
  };
};

export const triviaMinigameModule: MinigameModule<
  TriviaMinigameState,
  TriviaMinigameAction,
  TriviaHostView,
  TriviaDisplayView,
  TriviaMinigameContext
> = {
  id: "TRIVIA",
  init: ({ teamIds }) => {
    return {
      turnOrderTeamIds: [...teamIds],
      activeTurnIndex: 0,
      promptCursor: 0,
      pendingPointsByTeamId: {}
    };
  },
  reduce: ({ state, action, context, pointsMax }) => {
    if (action.type !== "recordAttempt") {
      return state;
    }

    if (state.turnOrderTeamIds.length === 0) {
      return state;
    }

    if (
      state.activeTurnIndex < 0 ||
      state.activeTurnIndex >= state.turnOrderTeamIds.length
    ) {
      return state;
    }

    const activeTurnTeamId = state.turnOrderTeamIds[state.activeTurnIndex] ?? null;

    if (activeTurnTeamId === null) {
      return state;
    }

    const nextPendingPointsByTeamId = clonePendingPoints(state.pendingPointsByTeamId);

    if (action.isCorrect) {
      const previousPoints = nextPendingPointsByTeamId[activeTurnTeamId] ?? 0;
      nextPendingPointsByTeamId[activeTurnTeamId] = Math.min(
        pointsMax,
        previousPoints + 1
      );
    }

    const nextTurnIndex =
      (state.activeTurnIndex + 1) % state.turnOrderTeamIds.length;

    const nextPromptCursor =
      context.prompts.length === 0
        ? state.promptCursor
        : (state.promptCursor + 1) % context.prompts.length;

    return {
      turnOrderTeamIds: [...state.turnOrderTeamIds],
      activeTurnIndex: nextTurnIndex,
      promptCursor: nextPromptCursor,
      pendingPointsByTeamId: nextPendingPointsByTeamId
    };
  },
  selectHostView,
  selectDisplayView
};

export const createTriviaStateWithPendingPoints = (
  state: TriviaMinigameState,
  pendingPointsByTeamId: Record<string, number>
): TriviaMinigameState => {
  return {
    turnOrderTeamIds: [...state.turnOrderTeamIds],
    activeTurnIndex: state.activeTurnIndex,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: clonePendingPoints(pendingPointsByTeamId)
  };
};

export const isTriviaMinigameState = (
  value: unknown
): value is TriviaMinigameState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const typedValue = value as Partial<TriviaMinigameState>;

  if (!Array.isArray(typedValue.turnOrderTeamIds)) {
    return false;
  }

  if (!typedValue.turnOrderTeamIds.every((teamId) => typeof teamId === "string")) {
    return false;
  }

  if (
    typeof typedValue.activeTurnIndex !== "number" ||
    !Number.isInteger(typedValue.activeTurnIndex)
  ) {
    return false;
  }

  if (
    typeof typedValue.promptCursor !== "number" ||
    !Number.isInteger(typedValue.promptCursor)
  ) {
    return false;
  }

  if (
    typeof typedValue.pendingPointsByTeamId !== "object" ||
    typedValue.pendingPointsByTeamId === null
  ) {
    return false;
  }

  const pendingPointsValues = Object.values(typedValue.pendingPointsByTeamId);

  if (!pendingPointsValues.every((points) => typeof points === "number")) {
    return false;
  }

  return true;
};
