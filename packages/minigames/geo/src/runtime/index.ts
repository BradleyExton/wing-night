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

type UnsupportedGeoRuntimeState = {
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  message: string;
};

const DEFAULT_UNSUPPORTED_MESSAGE = "GEO gameplay runtime is not implemented yet.";

const toGeoHostView = (state: UnsupportedGeoRuntimeState): MinigameHostView => {
  return {
    minigame: "GEO",
    activeTurnTeamId: state.activeTurnTeamId,
    attemptsRemaining: 0,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: state.message
  };
};

const toGeoDisplayView = (state: UnsupportedGeoRuntimeState): MinigameDisplayView => {
  return {
    minigame: "GEO",
    activeTurnTeamId: state.activeTurnTeamId,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: state.message
  };
};

const isUnsupportedGeoRuntimeState = (
  value: unknown
): value is UnsupportedGeoRuntimeState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const typedValue = value as Partial<UnsupportedGeoRuntimeState>;

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

  if (!Object.values(typedValue.pendingPointsByTeamId).every((value) => typeof value === "number")) {
    return false;
  }

  return typeof typedValue.message === "string";
};

export const geoMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

export const geoMinigameId: MinigameType = "GEO";

export const geoRuntimePlugin: MinigameRuntimePlugin = {
  id: geoMinigameId,
  metadata: geoMinigameMetadata,
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
    if (!isUnsupportedGeoRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isUnsupportedGeoRuntimeState(input.state)) {
      return null;
    }

    return toGeoHostView(input.state);
  },
  selectDisplayView: (input) => {
    if (!isUnsupportedGeoRuntimeState(input.state)) {
      return null;
    }

    return toGeoDisplayView(input.state);
  }
};
