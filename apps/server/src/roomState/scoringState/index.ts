import type { RoomState } from "@wingnight/shared";

import {
  captureMinigameRuntimeStateSnapshot,
  restoreMinigameRuntimeStateSnapshot
} from "../../minigames/runtime/index.js";
import { logScoreMutation } from "../../logger/index.js";
import { resolveMinigameRules } from "../selectors/index.js";
import {
  setScoringMutationUndoSnapshot,
  type ScoringMutationUndoSnapshot
} from "../stateStore/index.js";

export const clearScoringMutationUndoState = (state: RoomState): void => {
  setScoringMutationUndoSnapshot(null);
  state.canRedoScoringMutation = false;
};

const captureTeamTotalScoreById = (state: RoomState): Record<string, number> => {
  const teamTotalScoreById: Record<string, number> = {};

  for (const team of state.teams) {
    teamTotalScoreById[team.id] = team.totalScore;
  }

  return teamTotalScoreById;
};

export const createScoringMutationUndoSnapshot = (
  state: RoomState
): ScoringMutationUndoSnapshot => {
  return {
    round: state.currentRound,
    teamTotalScoreById: captureTeamTotalScoreById(state),
    wingParticipationByPlayerId: structuredClone(state.wingParticipationByPlayerId),
    pendingWingPointsByTeamId: structuredClone(state.pendingWingPointsByTeamId),
    pendingMinigamePointsByTeamId: structuredClone(state.pendingMinigamePointsByTeamId),
    minigameRuntimeSnapshot: captureMinigameRuntimeStateSnapshot()
  };
};

export const captureScoringMutationUndoState = (state: RoomState): void => {
  setScoringMutationUndoSnapshot(createScoringMutationUndoSnapshot(state));
};

export const restoreScoringMutationUndoState = (
  state: RoomState,
  snapshot: ScoringMutationUndoSnapshot
): void => {
  for (const team of state.teams) {
    const snapshotScore = snapshot.teamTotalScoreById[team.id];

    if (typeof snapshotScore === "number") {
      team.totalScore = snapshotScore;
    }
  }

  state.wingParticipationByPlayerId = structuredClone(
    snapshot.wingParticipationByPlayerId
  );
  state.pendingWingPointsByTeamId = structuredClone(
    snapshot.pendingWingPointsByTeamId
  );
  state.pendingMinigamePointsByTeamId = structuredClone(
    snapshot.pendingMinigamePointsByTeamId
  );
  const minigameType = state.currentRoundConfig?.minigame ?? null;
  restoreMinigameRuntimeStateSnapshot(
    state,
    snapshot.minigameRuntimeSnapshot,
    minigameType === null ? null : resolveMinigameRules(state, minigameType)
  );
};

export const recomputePendingWingPoints = (state: RoomState): void => {
  if (!state.currentRoundConfig) {
    state.pendingWingPointsByTeamId = {};
    return;
  }

  const pointsPerPlayer = state.currentRoundConfig.pointsPerPlayer;
  const nextPendingPointsByTeamId: Record<string, number> = {};

  for (const team of state.teams) {
    const ateCount = team.playerIds.reduce((count, playerId) => {
      return state.wingParticipationByPlayerId[playerId] === true ? count + 1 : count;
    }, 0);

    nextPendingPointsByTeamId[team.id] = ateCount * pointsPerPlayer;
  }

  state.pendingWingPointsByTeamId = nextPendingPointsByTeamId;
};

export const resetRoundWingParticipation = (state: RoomState): void => {
  state.wingParticipationByPlayerId = {};
  state.pendingWingPointsByTeamId = {};
};

export const clearPendingRoundScores = (state: RoomState): void => {
  state.pendingWingPointsByTeamId = {};
  state.pendingMinigamePointsByTeamId = {};
};

export const arePointsByTeamIdEqual = (
  left: Record<string, number>,
  right: Record<string, number>
): boolean => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
};

export const applyPendingRoundScoresToTotals = (state: RoomState): void => {
  for (const team of state.teams) {
    const wingPoints = state.pendingWingPointsByTeamId[team.id] ?? 0;
    const minigamePoints = state.pendingMinigamePointsByTeamId[team.id] ?? 0;
    const roundPoints = wingPoints + minigamePoints;

    if (roundPoints === 0) {
      continue;
    }

    team.totalScore += roundPoints;
    logScoreMutation(team.id, state.currentRound, wingPoints, minigamePoints, team.totalScore);
  }
};
