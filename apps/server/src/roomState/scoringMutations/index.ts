import { isDeepStrictEqual } from "node:util";

import {
  Phase,
  type MinigameDisplayView,
  type MinigameHostView,
  type MinigameType,
  type RoomState
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { logError, logManualScoreAdjustment } from "../../logger/index.js";
import {
  clearActiveMinigameRuntimeState,
  dispatchActiveMinigameRuntimeAction,
  syncActiveMinigameRuntimeWithPendingPoints
} from "../../minigames/runtime/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import {
  arePointsByTeamIdEqual,
  captureScoringMutationUndoState,
  clearScoringMutationUndoState,
  createScoringMutationUndoSnapshot,
  recomputePendingWingPoints,
  restoreScoringMutationUndoState
} from "../scoringState/index.js";
import {
  isMinigamePlayState,
  resolveMinigameContext,
  resolveMinigamePointsMax,
  resolveMinigameRules,
  resolveTeamIdByPlayerId
} from "../selectors/index.js";
import {
  getScoringMutationUndoSnapshot,
  setScoringMutationUndoSnapshot
} from "../stateStore/index.js";

export const setWingParticipation = defineRoomMutation({
  requiredPhase: Phase.EATING,
  run: (roomState, playerId: string, didEat: boolean): boolean => {
    if (!roomState.currentRoundConfig) {
      return false;
    }

    const playerExists = roomState.players.some((player) => player.id === playerId);

    if (!playerExists) {
      return false;
    }

    const playerTeamId = resolveTeamIdByPlayerId(roomState, playerId);

    if (playerTeamId === null) {
      return false;
    }

    if (
      roomState.activeRoundTeamId === null ||
      playerTeamId !== roomState.activeRoundTeamId
    ) {
      return false;
    }

    if (roomState.wingParticipationByPlayerId[playerId] === didEat) {
      return false;
    }

    captureScoringMutationUndoState(roomState);
    roomState.wingParticipationByPlayerId[playerId] = didEat;
    recomputePendingWingPoints(roomState);
    roomState.canRedoScoringMutation = true;

    return true;
  }
});

export const adjustTeamScore = defineRoomMutation({
  run: (roomState, teamId: string, delta: number): boolean => {
    if (roomState.phase === Phase.SETUP) {
      return false;
    }

    if (!Number.isInteger(delta) || delta === 0) {
      return false;
    }

    const targetTeam = roomState.teams.find((team) => team.id === teamId);

    if (!targetTeam) {
      return false;
    }

    const nextTotalScore = targetTeam.totalScore + delta;

    if (nextTotalScore < 0) {
      return false;
    }

    captureScoringMutationUndoState(roomState);
    targetTeam.totalScore = nextTotalScore;
    roomState.canRedoScoringMutation = true;
    logManualScoreAdjustment(
      targetTeam.id,
      delta,
      targetTeam.totalScore,
      roomState.currentRound,
      roomState.phase
    );

    return true;
  }
});

export const setPendingMinigamePoints = defineRoomMutation({
  requiredPhase: Phase.MINIGAME_PLAY,
  run: (roomState, pointsByTeamId: Record<string, number>): boolean => {
    const minigamePointsMax = resolveMinigamePointsMax(roomState);

    if (minigamePointsMax === null) {
      return false;
    }

    const activeRoundTeamId = roomState.activeRoundTeamId;

    if (activeRoundTeamId === null) {
      return false;
    }

    for (const teamId of Object.keys(pointsByTeamId)) {
      if (teamId !== activeRoundTeamId) {
        return false;
      }
    }

    const nextPoints = pointsByTeamId[activeRoundTeamId] ?? 0;

    if (
      !Number.isFinite(nextPoints) ||
      nextPoints < 0 ||
      nextPoints > minigamePointsMax
    ) {
      return false;
    }

    const nextPendingMinigamePointsByTeamId: Record<string, number> = {
      ...roomState.pendingMinigamePointsByTeamId,
      [activeRoundTeamId]: nextPoints
    };

    for (const team of roomState.teams) {
      if (nextPendingMinigamePointsByTeamId[team.id] === undefined) {
        nextPendingMinigamePointsByTeamId[team.id] = 0;
      }
    }

    if (
      arePointsByTeamIdEqual(
        roomState.pendingMinigamePointsByTeamId,
        nextPendingMinigamePointsByTeamId
      )
    ) {
      return false;
    }

    captureScoringMutationUndoState(roomState);
    roomState.pendingMinigamePointsByTeamId = nextPendingMinigamePointsByTeamId;
    roomState.canRedoScoringMutation = true;
    const minigameType = roomState.currentRoundConfig?.minigame ?? null;

    if (minigameType !== null) {
      syncActiveMinigameRuntimeWithPendingPoints(
        roomState,
        nextPendingMinigamePointsByTeamId,
        resolveMinigameRules(roomState, minigameType)
      );
    }

    return true;
  }
});

// Everything `projectActiveRuntimeStateToRoomState` writes, plus the redo flag
// the dispatch sets itself: the only room state a minigame action can move.
type MinigameProjection = {
  activeTurnTeamId: string | null;
  minigameHostView: MinigameHostView | null;
  minigameDisplayView: MinigameDisplayView | null;
  pendingMinigamePointsByTeamId: Record<string, number>;
  canRedoScoringMutation: boolean;
};

// Deliberately holds REFERENCES rather than cloning. Projection REPLACES these
// fields instead of mutating them, so a value captured here still describes the
// room as it was before the action — and because runtime reducers rebuild state
// by spreading, the parts an action did not touch stay identical by reference,
// which `isDeepStrictEqual` short-circuits on. The whole-room
// `getRoomStateSnapshot()` clone this replaced deep-copied the roster, the game
// config and every stroke on the easel, three times per action, which is 14
// times a second while a DRAWING turn is being flushed.
const captureMinigameProjection = (roomState: RoomState): MinigameProjection => {
  return {
    activeTurnTeamId: roomState.activeTurnTeamId,
    minigameHostView: roomState.minigameHostView,
    minigameDisplayView: roomState.minigameDisplayView,
    pendingMinigamePointsByTeamId: roomState.pendingMinigamePointsByTeamId,
    canRedoScoringMutation: roomState.canRedoScoringMutation
  };
};

// Runtime plugins own their didMutate signal for undo bookkeeping, but the
// broadcast decision compares the projection, because a plugin may report a
// mutation that projects to an identical room state.
const didMinigameProjectionChange = (
  previousProjection: MinigameProjection,
  roomState: RoomState
): boolean => {
  return !isDeepStrictEqual(previousProjection, captureMinigameProjection(roomState));
};

export const dispatchMinigameAction = defineRoomMutation({
  run: (
    roomState,
    minigameId: MinigameType,
    actionType: string,
    actionPayload: SerializableValue
  ): boolean => {
    if (!isMinigamePlayState(roomState, minigameId)) {
      return false;
    }

    const minigameContext = resolveMinigameContext(roomState, minigameId);

    if (minigameContext === null) {
      return false;
    }

    const previousProjection = captureMinigameProjection(roomState);
    const nextUndoSnapshot = createScoringMutationUndoSnapshot(roomState);
    let didRuntimeMutate = false;

    try {
      didRuntimeMutate = dispatchActiveMinigameRuntimeAction(
        roomState,
        {
          actionType,
          actionPayload,
          receivedAtMs: Date.now()
        },
        minigameContext.minigamePointsMax,
        minigameContext.minigameRules
      );
    } catch (error) {
      logError("server:minigameRuntimeFailure", error);
      clearActiveMinigameRuntimeState(roomState);
      return didMinigameProjectionChange(previousProjection, roomState);
    }

    if (!didRuntimeMutate) {
      return false;
    }

    setScoringMutationUndoSnapshot(nextUndoSnapshot);
    roomState.canRedoScoringMutation = true;

    return didMinigameProjectionChange(previousProjection, roomState);
  }
});

export const redoLastScoringMutation = defineRoomMutation({
  run: (roomState): boolean => {
    const scoringMutationUndoSnapshot = getScoringMutationUndoSnapshot();

    if (scoringMutationUndoSnapshot === null) {
      return false;
    }

    if (scoringMutationUndoSnapshot.round !== roomState.currentRound) {
      const couldRedoScoringMutation = roomState.canRedoScoringMutation;
      clearScoringMutationUndoState(roomState);
      return couldRedoScoringMutation;
    }

    restoreScoringMutationUndoState(roomState, scoringMutationUndoSnapshot);
    clearScoringMutationUndoState(roomState);

    return true;
  }
});
