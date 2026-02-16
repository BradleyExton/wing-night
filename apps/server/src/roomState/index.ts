import { Phase, type Player, type RoomState } from "@wingnight/shared";

import { logPhaseTransition } from "../logger/index.js";
import { getNextPhase } from "../utils/getNextPhase/index.js";

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [],
    teams: []
  };
};

// This module-scoped state is intentionally single-process for the MVP.
// If the server is scaled across workers/processes, migrate to shared storage.
const roomState = createInitialRoomState();

const overwriteRoomState = (nextState: RoomState): void => {
  Object.assign(roomState, nextState);
};

export const getRoomStateSnapshot = (): RoomState => {
  return structuredClone(roomState);
};

export const resetRoomState = (): RoomState => {
  overwriteRoomState(createInitialRoomState());

  return getRoomStateSnapshot();
};

export const setRoomStatePlayers = (players: Player[]): RoomState => {
  roomState.players = structuredClone(players);

  return getRoomStateSnapshot();
};

export const createTeam = (name: string): RoomState => {
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

export const advanceRoomStatePhase = (): RoomState => {
  const previousPhase = roomState.phase;
  const nextPhase = getNextPhase(previousPhase);

  roomState.phase = nextPhase;

  if (
    previousPhase === Phase.INTRO &&
    nextPhase === Phase.ROUND_INTRO &&
    roomState.currentRound === 0
  ) {
    roomState.currentRound = 1;
  }

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};
