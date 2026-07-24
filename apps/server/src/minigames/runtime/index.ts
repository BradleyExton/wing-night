import type {
  MinigameRuntimeActionEnvelope,
  SerializableValue
} from "@wingnight/minigames-core";
import type { MinigameType, RoomState } from "@wingnight/shared";

import { resolveMinigameRuntimePlugin } from "../registry/index.js";

type ActiveMinigameRuntimeState = {
  minigameId: MinigameType;
  runtimeState: SerializableValue;
};

export type MinigameRuntimeStateSnapshot = ActiveMinigameRuntimeState | null;

let activeMinigameRuntimeState: ActiveMinigameRuntimeState | null = null;
let minigameContentById: Partial<Record<MinigameType, SerializableValue>> = {};

const clearMinigameProjection = (state: RoomState): void => {
  state.activeTurnTeamId = null;
  state.minigameHostView = null;
  state.minigameDisplayView = null;
};

const resolveActiveRuntimeDescriptor = (
  state: RoomState
): { minigameId: MinigameType } | null => {
  const minigameId = state.currentRoundConfig?.minigame ?? null;

  if (minigameId === null) {
    return null;
  }

  return { minigameId };
};

const projectActiveRuntimeStateToRoomState = (
  state: RoomState,
  rules: SerializableValue | null
): void => {
  if (activeMinigameRuntimeState === null) {
    clearMinigameProjection(state);
    return;
  }

  const { minigameId, runtimeState } = activeMinigameRuntimeState;
  const runtimePlugin = resolveMinigameRuntimePlugin(minigameId);
  const content = minigameContentById[minigameId] ?? null;
  const hostView = runtimePlugin.selectHostView({
    state: runtimeState,
    rules,
    content
  });
  const displayView = runtimePlugin.selectDisplayView({
    state: runtimeState,
    rules,
    content
  });

  state.minigameHostView = hostView;
  state.minigameDisplayView = displayView;
  state.activeTurnTeamId = hostView?.activeTurnTeamId ?? null;

  if (hostView !== null) {
    state.pendingMinigamePointsByTeamId = { ...hostView.pendingPointsByTeamId };
  }
};

export const setMinigameContent = (
  minigameId: MinigameType,
  content: SerializableValue
): void => {
  minigameContentById = {
    ...minigameContentById,
    [minigameId]: structuredClone(content)
  };
};

export const resetMinigameRuntimeState = (): void => {
  activeMinigameRuntimeState = null;
};

export const captureMinigameRuntimeStateSnapshot = (): MinigameRuntimeStateSnapshot => {
  if (activeMinigameRuntimeState === null) {
    return null;
  }

  return structuredClone(activeMinigameRuntimeState);
};

export const restoreMinigameRuntimeStateSnapshot = (
  state: RoomState,
  snapshot: MinigameRuntimeStateSnapshot,
  rules: SerializableValue | null
): void => {
  if (snapshot === null) {
    activeMinigameRuntimeState = null;
    clearMinigameProjection(state);
    return;
  }

  if (state.currentRoundConfig?.minigame !== snapshot.minigameId) {
    activeMinigameRuntimeState = null;
    clearMinigameProjection(state);
    return;
  }

  activeMinigameRuntimeState = structuredClone(snapshot);
  projectActiveRuntimeStateToRoomState(state, rules);
};

export const clearActiveMinigameRuntimeState = (state: RoomState): void => {
  activeMinigameRuntimeState = null;
  clearMinigameProjection(state);
};

export const initializeActiveMinigameRuntimeState = (
  state: RoomState,
  pointsMax: number,
  rules: SerializableValue | null
): void => {
  const descriptor = resolveActiveRuntimeDescriptor(state);

  if (descriptor === null) {
    clearActiveMinigameRuntimeState(state);
    return;
  }

  const runtimePlugin = resolveMinigameRuntimePlugin(descriptor.minigameId);
  const runtimeState = runtimePlugin.initialize({
    teamIds: state.turnOrderTeamIds,
    activeRoundTeamId: state.activeRoundTeamId,
    pointsMax,
    pendingPointsByTeamId: state.pendingMinigamePointsByTeamId,
    rules,
    content: minigameContentById[descriptor.minigameId] ?? null
  });

  if (runtimeState === null) {
    clearActiveMinigameRuntimeState(state);
    return;
  }

  activeMinigameRuntimeState = {
    minigameId: descriptor.minigameId,
    runtimeState
  };
  projectActiveRuntimeStateToRoomState(state, rules);
};

type ActiveRuntimeContext = {
  minigameId: MinigameType;
  runtimeState: SerializableValue;
  runtimePlugin: ReturnType<typeof resolveMinigameRuntimePlugin>;
  content: SerializableValue | null;
};

// Shared preamble for operations against the active runtime: null-check the
// active state, match the expected minigame, resolve the plugin and content,
// derive the next runtime state, then reproject it onto room state. A `null`
// result from `deriveNextRuntimeState` leaves everything untouched.
const withActiveRuntime = (
  state: RoomState,
  rules: SerializableValue | null,
  deriveNextRuntimeState: (context: ActiveRuntimeContext) => SerializableValue | null,
  expectedMinigameId?: MinigameType
): boolean => {
  if (activeMinigameRuntimeState === null) {
    return false;
  }

  const expected =
    expectedMinigameId ?? state.currentRoundConfig?.minigame ?? null;

  if (expected !== activeMinigameRuntimeState.minigameId) {
    return false;
  }

  const { minigameId, runtimeState } = activeMinigameRuntimeState;
  const nextRuntimeState = deriveNextRuntimeState({
    minigameId,
    runtimeState,
    runtimePlugin: resolveMinigameRuntimePlugin(minigameId),
    content: minigameContentById[minigameId] ?? null
  });

  if (nextRuntimeState === null) {
    return false;
  }

  activeMinigameRuntimeState = { minigameId, runtimeState: nextRuntimeState };
  projectActiveRuntimeStateToRoomState(state, rules);

  return true;
};

export const syncActiveMinigameRuntimeWithPendingPoints = (
  state: RoomState,
  pendingPointsByTeamId: Record<string, number>,
  rules: SerializableValue | null
): void => {
  withActiveRuntime(state, rules, ({ runtimePlugin, runtimeState }) => {
    if (!runtimePlugin.syncPendingPoints) {
      return null;
    }

    return runtimePlugin.syncPendingPoints({
      state: runtimeState,
      pendingPointsByTeamId
    });
  });
};

export const syncActiveMinigameRuntimeWithContent = (
  state: RoomState,
  minigameId: MinigameType,
  rules: SerializableValue | null
): void => {
  withActiveRuntime(
    state,
    rules,
    ({ runtimePlugin, runtimeState, content }) => {
      if (!runtimePlugin.syncContent) {
        return null;
      }

      return runtimePlugin.syncContent({
        state: runtimeState,
        rules,
        content
      });
    },
    minigameId
  );
};

export const dispatchActiveMinigameRuntimeAction = (
  state: RoomState,
  envelope: MinigameRuntimeActionEnvelope,
  pointsMax: number,
  rules: SerializableValue | null
): boolean => {
  return withActiveRuntime(state, rules, ({ runtimePlugin, runtimeState, content }) => {
    const reductionResult = runtimePlugin.reduceAction({
      state: runtimeState,
      envelope,
      pointsMax,
      rules,
      content
    });

    return reductionResult.didMutate ? reductionResult.state : null;
  });
};
