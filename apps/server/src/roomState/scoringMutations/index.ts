import { Phase, type MinigameType, type RoomState } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { logError, logManualScoreAdjustment } from "../../logger/index.js";
import {
  clearActiveMinigameRuntimeState,
  dispatchActiveMinigameRuntimeAction,
  syncActiveMinigameRuntimeWithPendingPoints
} from "../../minigames/runtime/index.js";
import { getRoomStateSnapshot } from "../baseMutations/index.js";
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
  isRoomInFatalState,
  resolveMinigamePointsMax,
  resolveMinigameRules,
  resolveTeamIdByPlayerId
} from "../selectors/index.js";
import {
  getRoomState,
  getScoringMutationUndoSnapshot,
  setScoringMutationUndoSnapshot
} from "../stateStore/index.js";

export const setWingParticipation = (
  playerId: string,
  didEat: boolean
): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.EATING) {
    return getRoomStateSnapshot();
  }

  if (!roomState.currentRoundConfig) {
    return getRoomStateSnapshot();
  }

  const playerExists = roomState.players.some((player) => player.id === playerId);

  if (!playerExists) {
    return getRoomStateSnapshot();
  }

  const playerTeamId = resolveTeamIdByPlayerId(roomState, playerId);

  if (playerTeamId === null) {
    return getRoomStateSnapshot();
  }

  if (
    roomState.activeRoundTeamId === null ||
    playerTeamId !== roomState.activeRoundTeamId
  ) {
    return getRoomStateSnapshot();
  }

  if (roomState.wingParticipationByPlayerId[playerId] === didEat) {
    return getRoomStateSnapshot();
  }

  captureScoringMutationUndoState(roomState);
  roomState.wingParticipationByPlayerId[playerId] = didEat;
  recomputePendingWingPoints(roomState);
  roomState.canRedoScoringMutation = true;

  return getRoomStateSnapshot();
};

export const adjustTeamScore = (teamId: string, delta: number): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase === Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  if (!Number.isInteger(delta) || delta === 0) {
    return getRoomStateSnapshot();
  }

  const targetTeam = roomState.teams.find((team) => team.id === teamId);

  if (!targetTeam) {
    return getRoomStateSnapshot();
  }

  const nextTotalScore = targetTeam.totalScore + delta;

  if (nextTotalScore < 0) {
    return getRoomStateSnapshot();
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

  return getRoomStateSnapshot();
};

export const setPendingMinigamePoints = (
  pointsByTeamId: Record<string, number>
): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.MINIGAME_PLAY) {
    return getRoomStateSnapshot();
  }

  const minigamePointsMax = resolveMinigamePointsMax(roomState);

  if (minigamePointsMax === null) {
    return getRoomStateSnapshot();
  }

  const activeRoundTeamId = roomState.activeRoundTeamId;

  if (activeRoundTeamId === null) {
    return getRoomStateSnapshot();
  }

  for (const teamId of Object.keys(pointsByTeamId)) {
    if (teamId !== activeRoundTeamId) {
      return getRoomStateSnapshot();
    }
  }

  const nextPoints = pointsByTeamId[activeRoundTeamId] ?? 0;

  if (
    !Number.isFinite(nextPoints) ||
    nextPoints < 0 ||
    nextPoints > minigamePointsMax
  ) {
    return getRoomStateSnapshot();
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
    return getRoomStateSnapshot();
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

  return getRoomStateSnapshot();
};

export const dispatchMinigameAction = (
  minigameId: MinigameType,
  actionType: string,
  actionPayload: SerializableValue
): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (!isMinigamePlayState(roomState, minigameId)) {
    return getRoomStateSnapshot();
  }

  const minigamePointsMax = resolveMinigamePointsMax(roomState);

  if (minigamePointsMax === null) {
    return getRoomStateSnapshot();
  }

  const nextUndoSnapshot = createScoringMutationUndoSnapshot(roomState);
  let didMutate = false;

  try {
    didMutate = dispatchActiveMinigameRuntimeAction(
      roomState,
      {
        actionType,
        actionPayload
      },
      minigamePointsMax,
      resolveMinigameRules(roomState, minigameId)
    );
  } catch (error) {
    logError("server:minigameRuntimeFailure", error);
    clearActiveMinigameRuntimeState(roomState);
    return getRoomStateSnapshot();
  }

  if (!didMutate) {
    return getRoomStateSnapshot();
  }

  setScoringMutationUndoSnapshot(nextUndoSnapshot);
  roomState.canRedoScoringMutation = true;

  return getRoomStateSnapshot();
};

export const redoLastScoringMutation = (): RoomState => {
  const roomState = getRoomState();
  const scoringMutationUndoSnapshot = getScoringMutationUndoSnapshot();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (scoringMutationUndoSnapshot === null) {
    return getRoomStateSnapshot();
  }

  if (scoringMutationUndoSnapshot.round !== roomState.currentRound) {
    clearScoringMutationUndoState(roomState);
    return getRoomStateSnapshot();
  }

  const snapshotToRestore = scoringMutationUndoSnapshot;
  restoreScoringMutationUndoState(roomState, snapshotToRestore);
  clearScoringMutationUndoState(roomState);

  return getRoomStateSnapshot();
};
