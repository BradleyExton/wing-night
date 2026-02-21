import type { RoomState } from "@wingnight/shared";

import { logScoreMutation } from "../../logger/index.js";

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

export const resolveTeamIdByPlayerId = (
  state: RoomState,
  playerId: string
): string | null => {
  for (const team of state.teams) {
    if (team.playerIds.includes(playerId)) {
      return team.id;
    }
  }

  return null;
};
