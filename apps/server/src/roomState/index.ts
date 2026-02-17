import {
  Phase,
  type GameConfigFile,
  type Player,
  type RoomState
} from "@wingnight/shared";

import { logPhaseTransition } from "../logger/index.js";
import { getNextPhase } from "../utils/getNextPhase/index.js";

const DEFAULT_TOTAL_ROUNDS = 3;

const resolveCurrentRoundConfig = (state: RoomState): RoomState["currentRoundConfig"] => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  return state.gameConfig.rounds[state.currentRound - 1] ?? null;
};

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    players: [],
    teams: [],
    gameConfig: null,
    currentRoundConfig: null
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

export const setRoomStateGameConfig = (
  gameConfig: GameConfigFile
): RoomState => {
  roomState.gameConfig = structuredClone(gameConfig);
  roomState.totalRounds = gameConfig.rounds.length;
  roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

  return getRoomStateSnapshot();
};

export const createTeam = (name: string): RoomState => {
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

const isSetupReadyToStart = (state: RoomState): boolean => {
  if (state.gameConfig === null) {
    return false;
  }

  if (state.players.length === 0) {
    return false;
  }

  if (state.teams.length < 2) {
    return false;
  }

  const playerIds = new Set(state.players.map((player) => player.id));
  const assignedPlayerIds = new Set<string>();

  for (const team of state.teams) {
    if (team.playerIds.length === 0) {
      return false;
    }

    for (const playerId of team.playerIds) {
      if (!playerIds.has(playerId)) {
        return false;
      }

      if (assignedPlayerIds.has(playerId)) {
        return false;
      }

      assignedPlayerIds.add(playerId);
    }
  }

  return assignedPlayerIds.size === playerIds.size;
};

export const advanceRoomStatePhase = (): RoomState => {
  const previousPhase = roomState.phase;

  if (previousPhase === Phase.SETUP && !isSetupReadyToStart(roomState)) {
    return getRoomStateSnapshot();
  }

  const nextPhase = getNextPhase(
    previousPhase,
    roomState.currentRound,
    roomState.totalRounds
  );

  roomState.phase = nextPhase;

  if (
    previousPhase === Phase.INTRO &&
    nextPhase === Phase.ROUND_INTRO &&
    roomState.currentRound === 0
  ) {
    roomState.currentRound = 1;
  }

  if (previousPhase === Phase.ROUND_RESULTS && nextPhase === Phase.ROUND_INTRO) {
    roomState.currentRound += 1;
  }

  if (nextPhase === Phase.FINAL_RESULTS) {
    roomState.currentRoundConfig = null;
  } else {
    roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);
  }

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};
