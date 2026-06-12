import type {
  DrawingPrompt,
  DrawingPromptReveal,
  DrawingStroke,
  MinigameDisplayView,
  MinigameHostView
} from "@wingnight/shared";

import { cloneDrawingPrompt } from "../content/index.js";
import type { DrawingRuntimeContent, DrawingRuntimeState } from "../types/index.js";

export const resolveCurrentDrawingPrompt = (
  state: DrawingRuntimeState,
  content: DrawingRuntimeContent
): DrawingPrompt | null => {
  if (state.shuffledPromptIds.length === 0) {
    return null;
  }

  const promptId =
    state.shuffledPromptIds[state.promptCursor % state.shuffledPromptIds.length];

  if (promptId === undefined) {
    return null;
  }

  const currentPrompt = content.prompts.find((prompt) => prompt.id === promptId);

  if (currentPrompt === undefined) {
    return null;
  }

  return cloneDrawingPrompt(currentPrompt);
};

const cloneStrokes = (strokes: DrawingStroke[]): DrawingStroke[] => {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point }))
  }));
};

const cloneReveal = (
  reveal: DrawingPromptReveal | null
): DrawingPromptReveal | null => {
  return reveal === null ? null : { ...reveal };
};

export const toDrawingHostView = (
  state: DrawingRuntimeState,
  content: DrawingRuntimeContent
): MinigameHostView => {
  const currentPrompt = resolveCurrentDrawingPrompt(state, content);

  return {
    minigame: "DRAWING",
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    promptCursor: state.promptCursor,
    currentPrompt,
    strokes: cloneStrokes(state.strokes),
    activeStrokeId: state.activeStrokeId,
    reveal: cloneReveal(state.reveal)
  };
};

// The display projection must stay answer-safe: no current prompt, no
// cursor, no active stroke bookkeeping — only strokes and the post-result
// reveal the tablet already resolved.
export const toDrawingDisplayView = (
  state: DrawingRuntimeState
): MinigameDisplayView => {
  return {
    minigame: "DRAWING",
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    strokes: cloneStrokes(state.strokes),
    reveal: cloneReveal(state.reveal)
  };
};
