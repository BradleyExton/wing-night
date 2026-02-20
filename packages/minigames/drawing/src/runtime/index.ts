import {
  MINIGAME_API_VERSION,
  type MinigameDisplayView,
  type MinigameHostView,
  type MinigameType
} from "@wingnight/shared";
import type {
  MinigamePluginMetadata,
  MinigameRuntimePlugin
} from "@wingnight/minigames-core";

type UnsupportedDrawingRuntimeState = {
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  message: string;
};

const DEFAULT_UNSUPPORTED_MESSAGE = "DRAWING gameplay runtime is not implemented yet.";

const toDrawingHostView = (
  state: UnsupportedDrawingRuntimeState
): MinigameHostView => {
  return {
    minigame: "DRAWING",
    activeTurnTeamId: state.activeTurnTeamId,
    attemptsRemaining: 0,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: state.message
  };
};

const toDrawingDisplayView = (
  state: UnsupportedDrawingRuntimeState
): MinigameDisplayView => {
  return {
    minigame: "DRAWING",
    activeTurnTeamId: state.activeTurnTeamId,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: state.message
  };
};

const isUnsupportedDrawingRuntimeState = (
  value: unknown
): value is UnsupportedDrawingRuntimeState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const typedValue = value as Partial<UnsupportedDrawingRuntimeState>;

  if (
    typedValue.activeTurnTeamId !== null &&
    typeof typedValue.activeTurnTeamId !== "string"
  ) {
    return false;
  }

  if (
    typeof typedValue.promptCursor !== "number" ||
    !Number.isInteger(typedValue.promptCursor) ||
    typedValue.promptCursor < 0
  ) {
    return false;
  }

  if (
    typeof typedValue.pendingPointsByTeamId !== "object" ||
    typedValue.pendingPointsByTeamId === null
  ) {
    return false;
  }

  if (
    !Object.values(typedValue.pendingPointsByTeamId).every(
      (value) => typeof value === "number"
    )
  ) {
    return false;
  }

  return typeof typedValue.message === "string";
};

export const drawingMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

export const drawingMinigameId: MinigameType = "DRAWING";

export const drawingRuntimePlugin: MinigameRuntimePlugin = {
  id: drawingMinigameId,
  metadata: drawingMinigameMetadata,
  initialize: (input) => {
    return {
      activeTurnTeamId: input.activeRoundTeamId,
      promptCursor: 0,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId },
      message: DEFAULT_UNSUPPORTED_MESSAGE
    };
  },
  reduceAction: (input) => {
    return {
      state: input.state,
      didMutate: false
    };
  },
  syncPendingPoints: (input) => {
    if (!isUnsupportedDrawingRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isUnsupportedDrawingRuntimeState(input.state)) {
      return null;
    }

    return toDrawingHostView(input.state);
  },
  selectDisplayView: (input) => {
    if (!isUnsupportedDrawingRuntimeState(input.state)) {
      return null;
    }

    return toDrawingDisplayView(input.state);
  }
};
