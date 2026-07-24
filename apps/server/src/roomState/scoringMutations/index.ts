import { isDeepStrictEqual } from "node:util";

import { Phase, type MinigameType } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { logError, logManualScoreAdjustment } from "../../logger/index.js";
import {
  clearActiveMinigameRuntimeState,
  dispatchActiveMinigameRuntimeAction,
  syncActiveMinigameRuntimeWithPendingPoints
} from "../../minigames/runtime/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import { getRoomStateSnapshot } from "../getRoomStateSnapshot/index.js";
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

    // Runtime plugins own their didMutate signal for undo bookkeeping, but the
    // broadcast decision keeps the historical whole-state comparison because a
    // plugin may report a mutation that projects to an identical room state.
    const previousSnapshot = getRoomStateSnapshot();
    const nextUndoSnapshot = createScoringMutationUndoSnapshot(roomState);
    let didRuntimeMutate = false;

    try {
      didRuntimeMutate = dispatchActiveMinigameRuntimeAction(
        roomState,
        {
          actionType,
          actionPayload
        },
        minigameContext.minigamePointsMax,
        minigameContext.minigameRules
      );
    } catch (error) {
      logError("server:minigameRuntimeFailure", error);
      clearActiveMinigameRuntimeState(roomState);
      return !isDeepStrictEqual(previousSnapshot, getRoomStateSnapshot());
    }

    if (!didRuntimeMutate) {
      return false;
    }

    setScoringMutationUndoSnapshot(nextUndoSnapshot);
    roomState.canRedoScoringMutation = true;

    return !isDeepStrictEqual(previousSnapshot, getRoomStateSnapshot());
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
