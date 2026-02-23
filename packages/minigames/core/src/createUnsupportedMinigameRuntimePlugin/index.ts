import type {
  MinigameDisplayView,
  MinigameHostView,
  MinigameType
} from "@wingnight/shared";

import type {
  MinigamePluginMetadata,
  MinigameRuntimeInitializationInput,
  MinigameRuntimePlugin,
  MinigameRuntimeReductionInput,
  MinigameRuntimeSelectorInput,
  MinigameRuntimeSyncPendingPointsInput,
  SerializableValue
} from "../index.js";

type UnsupportedMinigameRuntimeState = {
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  message: string;
};

type CreateUnsupportedMinigameRuntimePluginOptions = {
  minigameId: MinigameType;
  metadata: MinigamePluginMetadata;
  unsupportedMessage: string;
};

const isUnsupportedMinigameRuntimeState = (
  value: SerializableValue
): value is UnsupportedMinigameRuntimeState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const typedValue = value as Partial<UnsupportedMinigameRuntimeState>;

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
      (entry) => typeof entry === "number"
    )
  ) {
    return false;
  }

  return typeof typedValue.message === "string";
};

const toUnsupportedHostView = (
  minigameId: MinigameType,
  state: UnsupportedMinigameRuntimeState
): MinigameHostView => {
  return {
    minigame: minigameId,
    activeTurnTeamId: state.activeTurnTeamId,
    attemptsRemaining: 0,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: state.message
  };
};

const toUnsupportedDisplayView = (
  minigameId: MinigameType,
  state: UnsupportedMinigameRuntimeState
): MinigameDisplayView => {
  return {
    minigame: minigameId,
    activeTurnTeamId: state.activeTurnTeamId,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: state.message
  };
};

export const createUnsupportedMinigameRuntimePlugin = ({
  minigameId,
  metadata,
  unsupportedMessage
}: CreateUnsupportedMinigameRuntimePluginOptions): MinigameRuntimePlugin => {
  return {
    id: minigameId,
    metadata,
    initialize: (input: MinigameRuntimeInitializationInput) => {
      return {
        activeTurnTeamId: input.activeRoundTeamId,
        promptCursor: 0,
        pendingPointsByTeamId: { ...input.pendingPointsByTeamId },
        message: unsupportedMessage
      };
    },
    reduceAction: (input: MinigameRuntimeReductionInput) => {
      return {
        state: input.state,
        didMutate: false
      };
    },
    syncPendingPoints: (input: MinigameRuntimeSyncPendingPointsInput) => {
      if (!isUnsupportedMinigameRuntimeState(input.state)) {
        return input.state;
      }

      return {
        ...input.state,
        pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
      };
    },
    selectHostView: (input: MinigameRuntimeSelectorInput) => {
      if (!isUnsupportedMinigameRuntimeState(input.state)) {
        return null;
      }

      return toUnsupportedHostView(minigameId, input.state);
    },
    selectDisplayView: (input: MinigameRuntimeSelectorInput) => {
      if (!isUnsupportedMinigameRuntimeState(input.state)) {
        return null;
      }

      return toUnsupportedDisplayView(minigameId, input.state);
    }
  };
};
