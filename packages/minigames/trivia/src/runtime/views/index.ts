import type {
  MinigameDisplayView,
  MinigameHostView,
  TriviaPrompt
} from "@wingnight/shared";

import type { TriviaMinigameContext } from "../../index.js";
import { cloneTriviaPrompt } from "../content/index.js";
import type { TriviaRuntimeContent, TriviaRuntimeState } from "../types/index.js";

export const resolveTriviaContext = (
  content: TriviaRuntimeContent
): TriviaMinigameContext => {
  return {
    prompts: content.prompts
  };
};

export const resolveAttemptsRemaining = (state: TriviaRuntimeState): number => {
  return Math.max(0, state.questionsPerTurnLimit - state.attemptsUsedThisTurn);
};

const resolveCurrentPrompt = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent
): TriviaPrompt | null => {
  if (content.prompts.length === 0) {
    return null;
  }

  const promptIndex = state.runtimeState.promptCursor % content.prompts.length;
  const currentPrompt = content.prompts[promptIndex];

  if (currentPrompt === undefined) {
    return null;
  }

  return cloneTriviaPrompt(currentPrompt);
};

export const toTriviaHostView = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent
): MinigameHostView => {
  return {
    minigame: "TRIVIA",
    activeTurnTeamId:
      state.runtimeState.turnOrderTeamIds[state.runtimeState.activeTurnIndex] ?? null,
    attemptsRemaining: resolveAttemptsRemaining(state),
    promptCursor: state.runtimeState.promptCursor,
    pendingPointsByTeamId: { ...state.runtimeState.pendingPointsByTeamId },
    currentPrompt: resolveCurrentPrompt(state, content)
  };
};

export const toTriviaDisplayView = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent
): MinigameDisplayView => {
  const currentPrompt = resolveCurrentPrompt(state, content);

  return {
    minigame: "TRIVIA",
    activeTurnTeamId:
      state.runtimeState.turnOrderTeamIds[state.runtimeState.activeTurnIndex] ?? null,
    promptCursor: state.runtimeState.promptCursor,
    pendingPointsByTeamId: { ...state.runtimeState.pendingPointsByTeamId },
    currentPrompt:
      currentPrompt === null
        ? null
        : {
            id: currentPrompt.id,
            question: currentPrompt.question
          }
  };
};
