import {
  Phase,
  resolveMinigameDefinition,
  type MinigameType,
  type RoomState,
  type RoomTimerState
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

export const isRoomInFatalState = (state: RoomState): boolean => {
  return state.fatalError !== null;
};

export const resolveCurrentRoundConfig = (
  state: RoomState
): RoomState["currentRoundConfig"] => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  return state.gameConfig.rounds[state.currentRound - 1] ?? null;
};

export const isMinigamePlayState = (
  state: RoomState,
  minigameId: MinigameType
): boolean => {
  return (
    state.phase === Phase.MINIGAME_PLAY &&
    state.currentRoundConfig?.minigame === minigameId
  );
};

export const resolveMinigamePointsMax = (state: RoomState): number | null => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  if (state.currentRound === state.totalRounds) {
    return state.gameConfig.minigameScoring.finalRoundMax;
  }

  return state.gameConfig.minigameScoring.defaultMax;
};

export const resolveMinigameRules = (
  state: RoomState,
  minigameType: MinigameType
): SerializableValue | null => {
  const minigameDefinition = resolveMinigameDefinition(minigameType);

  if (minigameDefinition.rulesKey === null) {
    return null;
  }

  return state.gameConfig?.minigameRules?.[minigameDefinition.rulesKey] ?? null;
};

export const resolveMinigameTimerSeconds = (state: RoomState): number | null => {
  if (!state.gameConfig || !state.currentRoundConfig) {
    return null;
  }

  const minigameDefinition = resolveMinigameDefinition(state.currentRoundConfig.minigame);

  return state.gameConfig.timers[minigameDefinition.timerKey] ?? null;
};

export const createRunningTimer = (
  phase: Phase,
  durationSeconds: number
): RoomTimerState => {
  const startedAt = Date.now();
  const durationMs = durationSeconds * 1000;

  return {
    phase,
    startedAt,
    endsAt: startedAt + durationMs,
    durationMs,
    isPaused: false,
    remainingMs: durationMs
  };
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

export const isExactTeamIdSet = (
  teamIds: string[],
  teams: RoomState["teams"]
): boolean => {
  if (teamIds.length !== teams.length) {
    return false;
  }

  const expectedTeamIds = new Set(teams.map((team) => team.id));
  const seenTeamIds = new Set<string>();

  for (const teamId of teamIds) {
    if (!expectedTeamIds.has(teamId) || seenTeamIds.has(teamId)) {
      return false;
    }

    seenTeamIds.add(teamId);
  }

  return seenTeamIds.size === expectedTeamIds.size;
};

export const isSetupReadyToStart = (state: RoomState): boolean => {
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
