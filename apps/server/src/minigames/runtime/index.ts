import type {
  MinigameAnsweringPlayer,
  MinigameContestant,
  MinigameDeadlineAction,
  MinigameRuntimeActionEnvelope,
  SerializableValue
} from "@wingnight/minigames-core";
import { resolveRoomTurnOrderTeamIds } from "@wingnight/shared";
import type { MinigamePlayerView, MinigameType, RoomState } from "@wingnight/shared";

import { findMinigameRuntimePlugin, resolveMinigameRuntimePlugin } from "../registry/index.js";

type ActiveMinigameRuntimeState = {
  minigameId: MinigameType;
  runtimeState: SerializableValue;
};

export type MinigameRuntimeStateSnapshot = ActiveMinigameRuntimeState | null;

let activeMinigameRuntimeState: ActiveMinigameRuntimeState | null = null;
let minigameContentById: Partial<Record<MinigameType, SerializableValue>> = {};
// What each game asked the round to remember (`MinigameRuntimePlugin.selectRoundMemory`),
// taken from the state every time it is projected — so it is always the latest state's, an
// undo included — and handed to the next team's `initialize` as `roundMemory`. Keyed by game
// and cleared at every round start, so a game played twice in a night starts each round clean.
let minigameRoundMemoryById: Partial<Record<MinigameType, SerializableValue>> = {};

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

// The playing team's players whose phones hold their faces right now, in roster order: who may
// answer on a phone (`MinigameRuntimePlugin.playerActionTypes`), and the "m" of every "n of m in".
// Derived from the claim flags on every call, never stored, so a phone claimed or let go mid-photo
// moves the count on the next projection.
export const resolveAnsweringPlayers = (state: RoomState): MinigameAnsweringPlayer[] => {
  const team = state.teams.find((candidate) => candidate.id === state.activeRoundTeamId);

  if (team === undefined) {
    return [];
  }

  return state.players
    .filter((player) => team.playerIds.includes(player.id) && state.claimedPlayerIds.includes(player.id))
    .map((player) => ({
      id: player.id,
      name: player.name,
      isConnected: state.connectedPlayerIds.includes(player.id)
    }));
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
  const answeringPlayers = resolveAnsweringPlayers(state);
  const hostView = runtimePlugin.selectHostView({
    state: runtimeState,
    rules,
    content,
    answeringPlayers
  });
  const displayView = runtimePlugin.selectDisplayView({
    state: runtimeState,
    rules,
    content,
    answeringPlayers
  });

  state.minigameHostView = hostView;
  state.minigameDisplayView = displayView;
  state.activeTurnTeamId = hostView?.activeTurnTeamId ?? null;

  if (hostView !== null) {
    state.pendingMinigamePointsByTeamId = { ...hostView.pendingPointsByTeamId };
  }

  if (runtimePlugin.selectRoundMemory !== undefined) {
    const memory = runtimePlugin.selectRoundMemory({ state: runtimeState, rules, content });

    minigameRoundMemoryById = {
      ...minigameRoundMemoryById,
      [minigameId]: memory === null ? undefined : structuredClone(memory)
    };
  }
};

/** A round starts clean: nothing a previous round's turns remembered reaches this one. */
export const clearMinigameRoundMemory = (): void => {
  minigameRoundMemoryById = {};
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
  minigameRoundMemoryById = {};
};

// Holds a REFERENCE to the live runtime state rather than copying it, which
// the plugin contract's no-mutation rule (`MinigameRuntimePlugin.reduceAction`)
// is what makes safe: every operation on the active runtime REPLACES this
// object wholesale, so the one captured here goes on describing the room as it
// was. `restoreMinigameRuntimeStateSnapshot` still clones on the way back out,
// so a restored state is never the snapshot's own.
//
// It used to deep-copy, which on a DRAWING turn meant copying every stroke on
// the easel on every point flush — fourteen times a second, growing with the
// drawing.
export const captureMinigameRuntimeStateSnapshot = (): MinigameRuntimeStateSnapshot => {
  return activeMinigameRuntimeState;
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
    // The round's order, not the base: a plugin that seeds its content bank
    // by a team's position sees where that team sits in THIS round.
    teamIds: resolveRoomTurnOrderTeamIds(state),
    players: state.players,
    teams: state.teams,
    activeRoundTeamId: state.activeRoundTeamId,
    pointsMax,
    pendingPointsByTeamId: state.pendingMinigamePointsByTeamId,
    rules,
    content: minigameContentById[descriptor.minigameId] ?? null,
    roundMemory: minigameRoundMemoryById[descriptor.minigameId] ?? null
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

// Whether an action is part of playing the turn rather than judging it
// (`MinigameRuntimePlugin.transientActionTypes`), and so must leave the undo
// point where it is.
export const isTransientMinigameAction = (
  minigameId: MinigameType,
  actionType: string
): boolean => {
  const transientActionTypes =
    findMinigameRuntimePlugin(minigameId)?.transientActionTypes ?? [];

  return transientActionTypes.includes(actionType);
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
      content,
      answeringPlayers: resolveAnsweringPlayers(state)
    });

    return reductionResult.didMutate ? reductionResult.state : null;
  });
};

// The answer hooks (`MinigameRuntimePlugin.playerActionTypes` and friends), read off the game. A
// game without them has no phone answers: its playing team's phones keep their idle card.
// Unknown games answer false: the name comes off the wire.
export const isPlayerAnswerMinigameAction = (minigameId: MinigameType, actionType: string): boolean => {
  const runtimePlugin = findMinigameRuntimePlugin(minigameId);

  return (
    runtimePlugin !== null &&
    runtimePlugin.reducePlayerAction !== undefined &&
    (runtimePlugin.playerActionTypes ?? []).includes(actionType)
  );
};

// A playing-team phone's answer reaching the game, from the player the socket's face names.
export const dispatchActivePlayerAnswer = (
  state: RoomState,
  playerId: string,
  envelope: MinigameRuntimeActionEnvelope,
  pointsMax: number,
  rules: SerializableValue | null
): boolean => {
  return withActiveRuntime(state, rules, ({ runtimePlugin, runtimeState, content }) => {
    if (runtimePlugin.reducePlayerAction === undefined) {
      return null;
    }

    const reductionResult = runtimePlugin.reducePlayerAction({
      state: runtimeState,
      envelope,
      pointsMax,
      rules,
      content,
      playerId,
      answeringPlayers: resolveAnsweringPlayers(state)
    });

    return reductionResult.didMutate ? reductionResult.state : null;
  });
};

// A face's claim ended: its holder's open answer leaves with them (`releasePlayerAnswer`).
export const releaseActivePlayerAnswer = (
  state: RoomState,
  playerId: string,
  rules: SerializableValue | null
): boolean => {
  return withActiveRuntime(state, rules, ({ runtimePlugin, runtimeState }) => {
    if (runtimePlugin.releasePlayerAnswer === undefined) {
      return null;
    }

    const releaseResult = runtimePlugin.releasePlayerAnswer({ state: runtimeState, playerId });

    return releaseResult.didMutate ? releaseResult.state : null;
  });
};

// Re-projects the game's views with the room as it stands now — for a change the game did not
// make, like a phone on the playing team claimed or let go, which moves every "n of m in".
export const refreshActiveMinigameProjection = (
  state: RoomState,
  rules: SerializableValue | null
): void => {
  if (activeMinigameRuntimeState === null || activeMinigameRuntimeState.minigameId !== state.currentRoundConfig?.minigame) {
    return;
  }

  projectActiveRuntimeStateToRoomState(state, rules);
};

// One playing-team phone's own answer card (`selectPlayerView`), for that player's room alone.
// Null for a player who is not seated on the playing team, and for a game with no phone answers.
export const selectActiveMinigamePlayerView = (
  state: RoomState,
  playerId: string,
  showOwnAnswer: boolean,
  rules: SerializableValue | null
): MinigamePlayerView | null => {
  const answeringPlayers = resolveAnsweringPlayers(state);

  if (!answeringPlayers.some((player) => player.id === playerId)) {
    return null;
  }

  return (
    selectFromActiveRuntime(rules, (plugin, input) =>
      plugin.selectPlayerView?.({ ...input, answeringPlayers, playerId, showOwnAnswer }) ?? null
    )?.result ?? null
  );
};

// The phone hooks (`MinigameRuntimePlugin.selectContestant` and friends), read off the active
// runtime. A game without them has no phone turns, whatever the host set for its round.
export const supportsContestantTurns = (minigameId: MinigameType): boolean => {
  const runtimePlugin = resolveMinigameRuntimePlugin(minigameId);

  return runtimePlugin.selectContestant !== undefined && runtimePlugin.contestantActionTypes !== undefined;
};

export const isContestantMinigameAction = (minigameId: MinigameType, actionType: string): boolean => {
  return (findMinigameRuntimePlugin(minigameId)?.contestantActionTypes ?? []).includes(actionType);
};

export const resolveContestantRetakeActionType = (minigameId: MinigameType): string | null => {
  return findMinigameRuntimePlugin(minigameId)?.contestantRetakeActionType ?? null;
};

// Whether this host action starts the whole turn over (`contestantResetActionType`).
export const isContestantResetAction = (minigameId: MinigameType, actionType: string): boolean => {
  return findMinigameRuntimePlugin(minigameId)?.contestantResetActionType === actionType;
};

const selectFromActiveRuntime = <TResult>(
  rules: SerializableValue | null,
  select: (
    plugin: ReturnType<typeof resolveMinigameRuntimePlugin>,
    input: { state: SerializableValue; rules: SerializableValue | null; content: SerializableValue | null }
  ) => TResult | null
): { minigameId: MinigameType; result: TResult } | null => {
  if (activeMinigameRuntimeState === null) {
    return null;
  }

  const { minigameId, runtimeState } = activeMinigameRuntimeState;
  const result = select(resolveMinigameRuntimePlugin(minigameId), {
    state: runtimeState,
    rules,
    content: minigameContentById[minigameId] ?? null
  });

  return result === null ? null : { minigameId, result };
};

export const selectActiveMinigameContestant = (
  rules: SerializableValue | null
): { minigameId: MinigameType; result: MinigameContestant } | null => {
  return selectFromActiveRuntime(rules, (plugin, input) => plugin.selectContestant?.(input) ?? null);
};

export const selectActiveMinigameDeadline = (
  rules: SerializableValue | null
): { minigameId: MinigameType; result: MinigameDeadlineAction } | null => {
  return selectFromActiveRuntime(rules, (plugin, input) => plugin.selectDeadlineAction?.(input) ?? null);
};
