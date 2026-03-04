import { Phase, type RoomState } from "@wingnight/shared";

import { getRoomStateSnapshot } from "../baseMutations/index.js";
import {
  isExactTeamIdSet,
  isRoomInFatalState
} from "../selectors/index.js";
import { getRoomState } from "../stateStore/index.js";

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
