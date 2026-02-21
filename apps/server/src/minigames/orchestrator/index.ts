import type { MinigameActionEnvelopePayload, MinigameType, RoomState } from "@wingnight/shared";

import { logError } from "../../logger/index.js";
import {
  getMinigameRegistryDescriptor,
  resetRegisteredMinigameRuntimeState
} from "../registry/index.js";

export type MinigameRuntimeSnapshotEnvelope = {
  minigameId: MinigameType;
  runtimeSnapshot: unknown;
} | null;

type RuntimeActionEnvelope = Omit<MinigameActionEnvelopePayload, "hostSecret">;

type MinigameRuntimeInitializationInput = {
  minigameId: MinigameType;
  pointsMax: number;
  questionsPerTurn: number;
};

type MinigameRuntimeDispatchInput = {
  actionEnvelope: RuntimeActionEnvelope;
  pointsMax: number;
  questionsPerTurn: number;
};

const applySafeShellSnapshotState = (state: RoomState): void => {
  state.activeTurnTeamId = null;
  state.currentTriviaPrompt = null;
  state.triviaPromptCursor = 0;
  state.minigameHostView = null;
  state.minigameDisplayView = null;
};

const logRuntimeError = (
  operation: string,
  minigameId: MinigameType,
  error: unknown
): void => {
  logError("server:minigameRuntimeError", {
    operation,
    minigameId,
    error
  });
};

const resolveActiveMinigameId = (state: RoomState): MinigameType | null => {
  return state.currentRoundConfig?.minigame ?? null;
};

export const initializeMinigameRuntime = (
  state: RoomState,
  input: MinigameRuntimeInitializationInput
): void => {
  const descriptor = getMinigameRegistryDescriptor(input.minigameId);
  const runtimeAdapter = descriptor.runtimeAdapter;

  if (runtimeAdapter === null) {
    applySafeShellSnapshotState(state);
    return;
  }

  try {
    runtimeAdapter.init(state, input.pointsMax, input.questionsPerTurn);
  } catch (error) {
    logRuntimeError("init", input.minigameId, error);
    applySafeShellSnapshotState(state);
  }
};

export const dispatchMinigameRuntimeAction = (
  state: RoomState,
  input: MinigameRuntimeDispatchInput
): boolean => {
  const descriptor = getMinigameRegistryDescriptor(input.actionEnvelope.minigameId);
  const runtimeAdapter = descriptor.runtimeAdapter;

  if (runtimeAdapter === null) {
    applySafeShellSnapshotState(state);
    return false;
  }

  try {
    return runtimeAdapter.dispatch({
      state,
      actionEnvelope: input.actionEnvelope,
      pointsMax: input.pointsMax,
      questionsPerTurn: input.questionsPerTurn
    });
  } catch (error) {
    logRuntimeError("dispatch", input.actionEnvelope.minigameId, error);
    applySafeShellSnapshotState(state);
    return false;
  }
};

export const syncMinigameRuntimePendingPoints = (
  state: RoomState,
  pendingPointsByTeamId: Record<string, number>
): void => {
  const activeMinigameId = resolveActiveMinigameId(state);

  if (activeMinigameId === null) {
    return;
  }

  const descriptor = getMinigameRegistryDescriptor(activeMinigameId);
  const runtimeAdapter = descriptor.runtimeAdapter;

  if (runtimeAdapter === null) {
    return;
  }

  try {
    runtimeAdapter.syncPendingPoints(state, pendingPointsByTeamId);
  } catch (error) {
    logRuntimeError("syncPendingPoints", activeMinigameId, error);
    applySafeShellSnapshotState(state);
  }
};

export const syncMinigameRuntimeContent = (state: RoomState): void => {
  const activeMinigameId = resolveActiveMinigameId(state);

  if (activeMinigameId === null) {
    return;
  }

  const descriptor = getMinigameRegistryDescriptor(activeMinigameId);
  const runtimeAdapter = descriptor.runtimeAdapter;

  if (runtimeAdapter === null) {
    return;
  }

  try {
    runtimeAdapter.syncContent(state);
  } catch (error) {
    logRuntimeError("syncContent", activeMinigameId, error);
    applySafeShellSnapshotState(state);
  }
};

export const clearMinigameRuntime = (state: RoomState): void => {
  const activeMinigameId = resolveActiveMinigameId(state);

  if (activeMinigameId !== null) {
    const descriptor = getMinigameRegistryDescriptor(activeMinigameId);
    const runtimeAdapter = descriptor.runtimeAdapter;

    if (runtimeAdapter !== null) {
      try {
        runtimeAdapter.clear(state);
      } catch (error) {
        logRuntimeError("clear", activeMinigameId, error);
      }
    }
  }

  applySafeShellSnapshotState(state);
};

export const resetMinigameRuntimeState = (): void => {
  resetRegisteredMinigameRuntimeState();
};

export const captureMinigameRuntimeSnapshot = (
  state: RoomState
): MinigameRuntimeSnapshotEnvelope => {
  const activeMinigameId = resolveActiveMinigameId(state);

  if (activeMinigameId === null) {
    return null;
  }

  const descriptor = getMinigameRegistryDescriptor(activeMinigameId);
  const runtimeAdapter = descriptor.runtimeAdapter;

  if (runtimeAdapter === null) {
    return null;
  }

  try {
    return {
      minigameId: activeMinigameId,
      runtimeSnapshot: runtimeAdapter.captureRuntimeSnapshot()
    };
  } catch (error) {
    logRuntimeError("capture", activeMinigameId, error);
    applySafeShellSnapshotState(state);
    return null;
  }
};

export const restoreMinigameRuntimeSnapshot = (
  state: RoomState,
  snapshot: MinigameRuntimeSnapshotEnvelope
): void => {
  if (snapshot === null) {
    clearMinigameRuntime(state);
    return;
  }

  const descriptor = getMinigameRegistryDescriptor(snapshot.minigameId);
  const runtimeAdapter = descriptor.runtimeAdapter;

  if (runtimeAdapter === null) {
    applySafeShellSnapshotState(state);
    return;
  }

  try {
    runtimeAdapter.restoreRuntimeSnapshot(state, snapshot.runtimeSnapshot);
  } catch (error) {
    logRuntimeError("restore", snapshot.minigameId, error);
    applySafeShellSnapshotState(state);
  }
};
