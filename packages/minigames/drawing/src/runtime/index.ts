import {
  MINIGAME_API_VERSION,
  type DrawingPromptOutcome,
  type DrawingStroke,
  type MinigameType
} from "@wingnight/shared";
import type {
  MinigamePluginMetadata,
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { parseDrawingContentFile, resolveDrawingContent } from "./content/index.js";
import {
  isAppendStrokePointsPayload,
  isBeginStrokePayload,
  isDrawingRuntimeState,
  isEndStrokePayload,
  sanitizeDrawingPoint
} from "./guards/index.js";
import {
  MAX_APPEND_POINTS_PER_ACTION,
  MAX_POINTS_PER_STROKE,
  MAX_STROKES,
  PROMPT_REVEAL_MS,
  type DrawingRuntimeState
} from "./types/index.js";
import {
  resolveCurrentDrawingPrompt,
  toDrawingDisplayView,
  toDrawingHostView
} from "./views/index.js";

export const drawingMinigameId: MinigameType = "DRAWING";

export const drawingMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

const shufflePromptIds = (promptIds: string[]): string[] => {
  const shuffled = [...promptIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const held = shuffled[index] as string;
    shuffled[index] = shuffled[swapIndex] as string;
    shuffled[swapIndex] = held;
  }

  return shuffled;
};

const resolveResultOutcome = (
  actionType: string
): DrawingPromptOutcome | null => {
  if (actionType === "markCorrect") {
    return "CORRECT";
  }

  if (actionType === "markIncorrect") {
    return "INCORRECT";
  }

  return null;
};

export const drawingRuntimePlugin: MinigameRuntimePlugin = {
  id: "DRAWING",
  metadata: drawingMinigameMetadata,
  content: {
    fileName: "minigames/drawing.json",
    parseFileContent: parseDrawingContentFile
  },
  initialize: (input) => {
    const drawingContent = resolveDrawingContent(input.content);

    const initialState: DrawingRuntimeState = {
      activeTurnTeamId: input.activeRoundTeamId ?? input.teamIds[0] ?? null,
      promptCursor: 0,
      shuffledPromptIds: shufflePromptIds(
        drawingContent.prompts.map((prompt) => prompt.id)
      ),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId },
      strokes: [],
      activeStrokeId: null,
      reveal: null
    };

    return initialState;
  },
  reduceAction: (input): MinigameRuntimeReductionResult => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isDrawingRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const actionType = input.envelope.actionType;

    if (actionType === "beginStroke") {
      if (!isBeginStrokePayload(input.envelope.actionPayload)) {
        return unchanged;
      }

      const payload = input.envelope.actionPayload;

      if (state.strokes.length >= MAX_STROKES) {
        return unchanged;
      }

      if (state.strokes.some((stroke) => stroke.strokeId === payload.strokeId)) {
        return unchanged;
      }

      const newStroke: DrawingStroke = {
        strokeId: payload.strokeId,
        points: [sanitizeDrawingPoint(payload.start)],
        color: payload.color,
        size: payload.size
      };

      return {
        state: {
          ...state,
          strokes: [...state.strokes, newStroke],
          activeStrokeId: payload.strokeId,
          reveal: null
        },
        didMutate: true
      };
    }

    if (actionType === "appendStrokePoints") {
      if (!isAppendStrokePointsPayload(input.envelope.actionPayload)) {
        return unchanged;
      }

      const payload = input.envelope.actionPayload;

      if (state.activeStrokeId === null || payload.strokeId !== state.activeStrokeId) {
        return unchanged;
      }

      const strokeIndex = state.strokes.findIndex(
        (stroke) => stroke.strokeId === payload.strokeId
      );
      const activeStroke = state.strokes[strokeIndex];

      if (activeStroke === undefined) {
        return unchanged;
      }

      const remainingCapacity = MAX_POINTS_PER_STROKE - activeStroke.points.length;
      const appendedPoints = payload.points
        .slice(0, Math.min(MAX_APPEND_POINTS_PER_ACTION, remainingCapacity))
        .map(sanitizeDrawingPoint);

      if (appendedPoints.length === 0) {
        return unchanged;
      }

      const nextStrokes = [...state.strokes];
      nextStrokes[strokeIndex] = {
        ...activeStroke,
        points: [...activeStroke.points, ...appendedPoints]
      };

      return {
        state: {
          ...state,
          strokes: nextStrokes
        },
        didMutate: true
      };
    }

    if (actionType === "endStroke") {
      if (!isEndStrokePayload(input.envelope.actionPayload)) {
        return unchanged;
      }

      if (
        state.activeStrokeId === null ||
        input.envelope.actionPayload.strokeId !== state.activeStrokeId
      ) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          activeStrokeId: null
        },
        didMutate: true
      };
    }

    if (actionType === "undoStroke") {
      if (state.strokes.length === 0) {
        return unchanged;
      }

      const removedStroke = state.strokes[state.strokes.length - 1];

      return {
        state: {
          ...state,
          strokes: state.strokes.slice(0, -1),
          activeStrokeId:
            removedStroke !== undefined &&
            removedStroke.strokeId === state.activeStrokeId
              ? null
              : state.activeStrokeId
        },
        didMutate: true
      };
    }

    if (actionType === "clearCanvas") {
      if (state.strokes.length === 0 && state.activeStrokeId === null) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          strokes: [],
          activeStrokeId: null
        },
        didMutate: true
      };
    }

    const resultOutcome = resolveResultOutcome(actionType);

    if (resultOutcome !== null) {
      const drawingContent = resolveDrawingContent(input.content);
      const currentPrompt = resolveCurrentDrawingPrompt(state, drawingContent);

      if (currentPrompt === null || state.activeTurnTeamId === null) {
        return unchanged;
      }

      const nowMs = Date.now();
      const previousPoints =
        state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0;
      const pendingPointsByTeamId =
        resultOutcome === "CORRECT"
          ? {
              ...state.pendingPointsByTeamId,
              [state.activeTurnTeamId]: Math.min(
                input.pointsMax,
                previousPoints + 1
              )
            }
          : { ...state.pendingPointsByTeamId };

      return {
        state: {
          ...state,
          promptCursor: state.promptCursor + 1,
          pendingPointsByTeamId,
          strokes: [],
          activeStrokeId: null,
          reveal: {
            promptId: currentPrompt.id,
            promptText: currentPrompt.prompt,
            outcome: resultOutcome,
            revealedAtMs: nowMs,
            expiresAtMs: nowMs + PROMPT_REVEAL_MS
          }
        },
        didMutate: true
      };
    }

    if (actionType === "skipPrompt") {
      const drawingContent = resolveDrawingContent(input.content);
      const currentPrompt = resolveCurrentDrawingPrompt(state, drawingContent);

      if (currentPrompt === null) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          promptCursor: state.promptCursor + 1,
          strokes: [],
          activeStrokeId: null,
          reveal: null
        },
        didMutate: true
      };
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isDrawingRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  syncContent: (input) => {
    if (!isDrawingRuntimeState(input.state)) {
      return input.state;
    }

    const drawingContent = resolveDrawingContent(input.content);
    const contentPromptIds = drawingContent.prompts.map((prompt) => prompt.id);
    const contentPromptIdSet = new Set(contentPromptIds);
    const retainedPromptIds = input.state.shuffledPromptIds.filter((promptId) =>
      contentPromptIdSet.has(promptId)
    );
    const retainedPromptIdSet = new Set(retainedPromptIds);
    const introducedPromptIds = contentPromptIds.filter(
      (promptId) => !retainedPromptIdSet.has(promptId)
    );

    return {
      ...input.state,
      shuffledPromptIds: [...retainedPromptIds, ...introducedPromptIds]
    };
  },
  selectHostView: (input) => {
    if (!isDrawingRuntimeState(input.state)) {
      return null;
    }

    return toDrawingHostView(input.state, resolveDrawingContent(input.content));
  },
  selectDisplayView: (input) => {
    if (!isDrawingRuntimeState(input.state)) {
      return null;
    }

    return toDrawingDisplayView(input.state);
  }
};
