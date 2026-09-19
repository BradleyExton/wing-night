import type {
  RecreateMinigameDisplayView,
  RecreateMinigameHostView,
  RecreateMinigameTarget,
  RecreatePrompt
} from "@wingnight/shared";

import { cloneRecreatePrompt } from "../content/index.js";
import type { RecreateRuntimeContent, RecreateRuntimeState } from "../types/index.js";

export const resolveCurrentRecreatePrompt = (
  state: RecreateRuntimeState,
  content: RecreateRuntimeContent
): RecreatePrompt | null => {
  if (content.prompts.length === 0) {
    return null;
  }

  const prompt = content.prompts[state.promptCursor % content.prompts.length];

  return prompt === undefined ? null : cloneRecreatePrompt(prompt);
};

export const resolveActiveTurnTeamId = (state: RecreateRuntimeState): string | null => {
  return state.turnOrderTeamIds[state.activeTurnIndex] ?? null;
};

const toTarget = (prompt: RecreatePrompt): RecreateMinigameTarget => {
  return {
    id: prompt.id,
    title: prompt.title,
    targetImageSrc: prompt.targetImageSrc,
    sourceImageSrc: prompt.sourceImageSrc ?? null
  };
};

const toSharedFields = (
  state: RecreateRuntimeState,
  prompt: RecreatePrompt | null
): Omit<RecreateMinigameHostView, "checklist"> => {
  return {
    minigame: "RECREATE",
    activeTurnTeamId: resolveActiveTurnTeamId(state),
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    subState: state.subState,
    targetsPerTurn: state.targetsPerTurn,
    targetsCompletedThisTurn: state.targetsCompletedThisTurn,
    pointsPerIngredient: state.pointsPerIngredient,
    liveGeneration: state.liveGeneration,
    currentTarget: prompt === null ? null : toTarget(prompt),
    attempt: state.attempt === null ? null : { ...state.attempt },
    lastPointsAwarded: state.lastPointsAwarded
  };
};

export const toRecreateHostView = (
  state: RecreateRuntimeState,
  content: RecreateRuntimeContent
): RecreateMinigameHostView => {
  const prompt = resolveCurrentRecreatePrompt(state, content);
  const isChecklistOpen = state.subState !== "writing" && prompt !== null;

  return {
    ...toSharedFields(state, prompt),
    checklist:
      isChecklistOpen && prompt !== null
        ? {
            ingredients: [...prompt.ingredients],
            checkedIngredientIndexes: [...state.checkedIngredientIndexes],
            authoredPrompt: prompt.prompt
          }
        : null
  };
};

export const toRecreateDisplayView = (
  state: RecreateRuntimeState,
  content: RecreateRuntimeContent
): RecreateMinigameDisplayView => {
  const prompt = resolveCurrentRecreatePrompt(state, content);
  const isChecklistOpen = state.subState !== "writing" && prompt !== null;

  return {
    ...toSharedFields(state, prompt),
    ingredients: isChecklistOpen && prompt !== null ? [...prompt.ingredients] : null,
    checkedIngredientIndexes: isChecklistOpen ? [...state.checkedIngredientIndexes] : [],
    authoredPrompt: state.subState === "scored" && prompt !== null ? prompt.prompt : null
  };
};
