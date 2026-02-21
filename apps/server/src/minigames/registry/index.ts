import {
  MINIGAME_ACTION_TYPES,
  MINIGAME_CONTRACT_METADATA_BY_ID,
  type MinigameActionEnvelopePayload,
  type MinigameType,
  type RoomState,
  type TriviaPrompt
} from "@wingnight/shared";

import {
  captureTriviaRuntimeStateSnapshot,
  clearTriviaRuntimeState,
  initializeTriviaRuntimeState,
  reduceTriviaAttempt,
  resetTriviaRuntimeState,
  restoreTriviaRuntimeStateSnapshot,
  syncTriviaRuntimeWithPendingPoints,
  syncTriviaRuntimeWithPrompts,
  type TriviaRuntimeStateSnapshot
} from "../triviaRuntime/index.js";
import { loadTrivia } from "../../contentLoader/loadTrivia/index.js";

type RuntimeActionEnvelope = Omit<MinigameActionEnvelopePayload, "hostSecret">;

export type MinigameContentLoaderOptions = {
  contentRootDir?: string;
};

export type MinigameLoadedContent = {
  minigameId: MinigameType;
  triviaPrompts: TriviaPrompt[];
  placeholderState: string | null;
};

export type MinigameRuntimeAdapterDispatchInput = {
  state: RoomState;
  actionEnvelope: RuntimeActionEnvelope;
  pointsMax: number;
  questionsPerTurn: number;
};

export type MinigameRuntimeAdapter = {
  init: (state: RoomState, pointsMax: number, questionsPerTurn: number) => void;
  dispatch: (input: MinigameRuntimeAdapterDispatchInput) => boolean;
  syncPendingPoints: (
    state: RoomState,
    pendingPointsByTeamId: Record<string, number>
  ) => void;
  syncContent: (state: RoomState) => void;
  clear: (state: RoomState) => void;
  captureRuntimeSnapshot: () => unknown;
  restoreRuntimeSnapshot: (state: RoomState, snapshot: unknown) => void;
  resetRuntime: () => void;
};

export type MinigameRegistryDescriptor = {
  minigameId: MinigameType;
  minigameApiVersion: number;
  capabilityFlags: string[];
  hasRuntimeAdapter: boolean;
  runtimeAdapter: MinigameRuntimeAdapter | null;
  loadContent: (options?: MinigameContentLoaderOptions) => MinigameLoadedContent;
};

const createNoRequiredContentPlaceholder = (
  minigameId: MinigameType
): MinigameLoadedContent => {
  return {
    minigameId,
    triviaPrompts: [],
    placeholderState: "No required content yet."
  };
};

const isTriviaAttemptActionPayload = (
  value: unknown
): value is { isCorrect: boolean } => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (!("isCorrect" in value)) {
    return false;
  }

  return typeof value.isCorrect === "boolean";
};

const triviaRuntimeAdapter: MinigameRuntimeAdapter = {
  init: (state, pointsMax, questionsPerTurn) => {
    initializeTriviaRuntimeState(state, pointsMax, questionsPerTurn);
  },
  dispatch: ({ state, actionEnvelope, pointsMax, questionsPerTurn }) => {
    if (
      actionEnvelope.actionType !== MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT ||
      !isTriviaAttemptActionPayload(actionEnvelope.actionPayload)
    ) {
      return false;
    }

    return reduceTriviaAttempt(
      state,
      actionEnvelope.actionPayload.isCorrect,
      pointsMax,
      questionsPerTurn
    );
  },
  syncPendingPoints: (state, pendingPointsByTeamId) => {
    syncTriviaRuntimeWithPendingPoints(state, pendingPointsByTeamId);
  },
  syncContent: (state) => {
    syncTriviaRuntimeWithPrompts(state);
  },
  clear: (state) => {
    clearTriviaRuntimeState(state);
  },
  captureRuntimeSnapshot: () => {
    return captureTriviaRuntimeStateSnapshot();
  },
  restoreRuntimeSnapshot: (state, snapshot) => {
    restoreTriviaRuntimeStateSnapshot(
      state,
      snapshot as TriviaRuntimeStateSnapshot | null
    );
  },
  resetRuntime: () => {
    resetTriviaRuntimeState();
  }
};

const MINIGAME_REGISTRY: Record<MinigameType, MinigameRegistryDescriptor> = {
  TRIVIA: {
    minigameId: "TRIVIA",
    minigameApiVersion: MINIGAME_CONTRACT_METADATA_BY_ID.TRIVIA.minigameApiVersion,
    capabilityFlags: [...MINIGAME_CONTRACT_METADATA_BY_ID.TRIVIA.capabilityFlags],
    hasRuntimeAdapter: true,
    runtimeAdapter: triviaRuntimeAdapter,
    loadContent: (options = {}) => {
      try {
        return {
          minigameId: "TRIVIA",
          triviaPrompts: loadTrivia(options),
          placeholderState: null
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed minigame content load (minigameId=TRIVIA): ${errorMessage}`
        );
      }
    }
  },
  GEO: {
    minigameId: "GEO",
    minigameApiVersion: MINIGAME_CONTRACT_METADATA_BY_ID.GEO.minigameApiVersion,
    capabilityFlags: [...MINIGAME_CONTRACT_METADATA_BY_ID.GEO.capabilityFlags],
    hasRuntimeAdapter: false,
    runtimeAdapter: null,
    loadContent: () => createNoRequiredContentPlaceholder("GEO")
  },
  DRAWING: {
    minigameId: "DRAWING",
    minigameApiVersion: MINIGAME_CONTRACT_METADATA_BY_ID.DRAWING.minigameApiVersion,
    capabilityFlags: [...MINIGAME_CONTRACT_METADATA_BY_ID.DRAWING.capabilityFlags],
    hasRuntimeAdapter: false,
    runtimeAdapter: null,
    loadContent: () => createNoRequiredContentPlaceholder("DRAWING")
  }
};

export const getMinigameRegistryDescriptor = (
  minigameId: MinigameType
): MinigameRegistryDescriptor => {
  const descriptor = MINIGAME_REGISTRY[minigameId];

  return {
    minigameId: descriptor.minigameId,
    minigameApiVersion: descriptor.minigameApiVersion,
    capabilityFlags: [...descriptor.capabilityFlags],
    hasRuntimeAdapter: descriptor.hasRuntimeAdapter,
    runtimeAdapter: descriptor.runtimeAdapter,
    loadContent: descriptor.loadContent
  };
};

export const resetRegisteredMinigameRuntimeState = (): void => {
  for (const descriptor of Object.values(MINIGAME_REGISTRY)) {
    descriptor.runtimeAdapter?.resetRuntime();
  }
};
