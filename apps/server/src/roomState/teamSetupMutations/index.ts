import { Phase, type RoomState } from "@wingnight/shared";

import { getRoomStateSnapshot } from "../baseMutations/index.js";
import {
  isExactTeamIdSet,
  isRoomInFatalState
} from "../selectors/index.js";
import { getRoomState } from "../stateStore/index.js";

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

export const addPlayer = (name: string): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    return getRoomStateSnapshot();
  }

  const nextPlayerId = resolveNextPlayerId(roomState.players.map((player) => player.id));
  roomState.players.push({
    id: nextPlayerId,
    name: normalizedName
  });

  return getRoomStateSnapshot();
};

export const createTeam = (name: string): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    return getRoomStateSnapshot();
  }

  const nextTeamIndex = roomState.teams.length + 1;
  roomState.teams.push({
    id: `team-${nextTeamIndex}`,
    name: normalizedName,
    playerIds: [],
    totalScore: 0
  });

  return getRoomStateSnapshot();
};

export const assignPlayerToTeam = (
  playerId: string,
  teamId: string | null
): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  const playerExists = roomState.players.some((player) => player.id === playerId);

  if (!playerExists) {
    return getRoomStateSnapshot();
  }

  if (teamId !== null && !roomState.teams.some((team) => team.id === teamId)) {
    return getRoomStateSnapshot();
  }

  for (const team of roomState.teams) {
    team.playerIds = team.playerIds.filter((id) => id !== playerId);
  }

  if (teamId === null) {
    return getRoomStateSnapshot();
  }

  const targetTeam = roomState.teams.find((team) => team.id === teamId);

  if (!targetTeam) {
    return getRoomStateSnapshot();
  }

  targetTeam.playerIds.push(playerId);

  return getRoomStateSnapshot();
};

export const autoAssignRemainingPlayers = (): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  if (roomState.teams.length === 0 || roomState.players.length === 0) {
    return getRoomStateSnapshot();
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

  return getRoomStateSnapshot();
};

export const reorderTurnOrder = (teamIds: string[]): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.ROUND_INTRO) {
    return getRoomStateSnapshot();
  }

  if (!Array.isArray(teamIds) || !teamIds.every((teamId) => typeof teamId === "string")) {
    return getRoomStateSnapshot();
  }

  if (!isExactTeamIdSet(teamIds, roomState.teams)) {
    return getRoomStateSnapshot();
  }

  roomState.turnOrderTeamIds = [...teamIds];
  roomState.roundTurnCursor = teamIds.length > 0 ? 0 : -1;
  roomState.completedRoundTurnTeamIds = [];
  roomState.activeRoundTeamId =
    roomState.roundTurnCursor === -1
      ? null
      : roomState.turnOrderTeamIds[roomState.roundTurnCursor] ?? null;

  return getRoomStateSnapshot();
};
