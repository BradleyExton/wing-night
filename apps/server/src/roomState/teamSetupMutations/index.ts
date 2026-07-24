import { Phase } from "@wingnight/shared";

import { defineRoomMutation } from "../defineRoomMutation/index.js";
import { isExactTeamIdSet } from "../selectors/index.js";

const resolveNextPlayerId = (existingPlayerIds: string[]): string => {
  const maxExistingSuffix = existingPlayerIds.reduce((maxSuffix, playerId) => {
    const match = /^player-(\d+)$/.exec(playerId);

    if (!match) {
      return maxSuffix;
    }

    const parsedSuffix = Number(match[1]);

    if (!Number.isInteger(parsedSuffix) || parsedSuffix <= maxSuffix) {
      return maxSuffix;
    }

    return parsedSuffix;
  }, 0);

  return `player-${maxExistingSuffix + 1}`;
};

export const addPlayer = defineRoomMutation({
  requiredPhase: Phase.SETUP,
  run: (roomState, name: string): boolean => {
    const normalizedName = name.trim();

    if (normalizedName.length === 0) {
      return false;
    }

    const nextPlayerId = resolveNextPlayerId(roomState.players.map((player) => player.id));
    roomState.players.push({
      id: nextPlayerId,
      name: normalizedName
    });

    return true;
  }
});

export const createTeam = defineRoomMutation({
  requiredPhase: Phase.SETUP,
  run: (roomState, name: string): boolean => {
    const normalizedName = name.trim();

    if (normalizedName.length === 0) {
      return false;
    }

    const nextTeamIndex = roomState.teams.length + 1;
    roomState.teams.push({
      id: `team-${nextTeamIndex}`,
      name: normalizedName,
      playerIds: [],
      totalScore: 0
    });

    return true;
  }
});

export const assignPlayerToTeam = defineRoomMutation({
  requiredPhase: Phase.SETUP,
  run: (roomState, playerId: string, teamId: string | null): boolean => {
    const playerExists = roomState.players.some((player) => player.id === playerId);

    if (!playerExists) {
      return false;
    }

    if (teamId !== null && !roomState.teams.some((team) => team.id === teamId)) {
      return false;
    }

    const previousTeamPlayerIds = roomState.teams.map((team) => [...team.playerIds]);

    for (const team of roomState.teams) {
      team.playerIds = team.playerIds.filter((id) => id !== playerId);
    }

    if (teamId !== null) {
      roomState.teams.find((team) => team.id === teamId)?.playerIds.push(playerId);
    }

    return roomState.teams.some((team, teamIndex) => {
      const previousPlayerIds = previousTeamPlayerIds[teamIndex] ?? [];

      return (
        team.playerIds.length !== previousPlayerIds.length ||
        team.playerIds.some((id, playerIndex) => id !== previousPlayerIds[playerIndex])
      );
    });
  }
});

export const autoAssignRemainingPlayers = defineRoomMutation({
  requiredPhase: Phase.SETUP,
  run: (roomState): boolean => {
    if (roomState.teams.length === 0 || roomState.players.length === 0) {
      return false;
    }

    const assignedPlayerIdSet = new Set<string>();

    for (const team of roomState.teams) {
      for (const playerId of team.playerIds) {
        assignedPlayerIdSet.add(playerId);
      }
    }

    const unassignedPlayerIds = roomState.players
      .map((player) => player.id)
      .filter((playerId) => !assignedPlayerIdSet.has(playerId));

    for (const playerId of unassignedPlayerIds) {
      let targetTeamIndex = 0;

      for (let teamIndex = 1; teamIndex < roomState.teams.length; teamIndex += 1) {
        const targetTeam = roomState.teams[targetTeamIndex];
        const candidateTeam = roomState.teams[teamIndex];

        if (!targetTeam || !candidateTeam) {
          continue;
        }

        if (candidateTeam.playerIds.length < targetTeam.playerIds.length) {
          targetTeamIndex = teamIndex;
        }
      }

      roomState.teams[targetTeamIndex]?.playerIds.push(playerId);
    }

    return unassignedPlayerIds.length > 0;
  }
});

export const reorderTurnOrder = defineRoomMutation({
  requiredPhase: Phase.ROUND_INTRO,
  run: (roomState, teamIds: string[]): boolean => {
    if (!isExactTeamIdSet(teamIds, roomState.teams)) {
      return false;
    }

    const nextRoundTurnCursor = teamIds.length > 0 ? 0 : -1;
    const nextActiveRoundTeamId =
      nextRoundTurnCursor === -1 ? null : teamIds[nextRoundTurnCursor] ?? null;
    const didChange =
      roomState.turnOrderTeamIds.length !== teamIds.length ||
      roomState.turnOrderTeamIds.some((teamId, index) => teamId !== teamIds[index]) ||
      roomState.roundTurnCursor !== nextRoundTurnCursor ||
      roomState.completedRoundTurnTeamIds.length !== 0 ||
      roomState.activeRoundTeamId !== nextActiveRoundTeamId;

    roomState.turnOrderTeamIds = [...teamIds];
    roomState.roundTurnCursor = nextRoundTurnCursor;
    roomState.completedRoundTurnTeamIds = [];
    roomState.activeRoundTeamId = nextActiveRoundTeamId;

    return didChange;
  }
});
