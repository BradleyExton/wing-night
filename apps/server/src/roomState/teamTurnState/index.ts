import type { RoomState } from "@wingnight/shared";

export const ensureTurnOrderTeamIds = (state: RoomState): void => {
  if (state.turnOrderTeamIds.length > 0) {
    return;
  }

  state.turnOrderTeamIds = state.teams.map((team) => team.id);
};

export const initializeRoundTurnState = (state: RoomState): void => {
  ensureTurnOrderTeamIds(state);
  state.roundTurnCursor = state.turnOrderTeamIds.length > 0 ? 0 : -1;
  state.completedRoundTurnTeamIds = [];
  state.activeRoundTeamId =
    state.roundTurnCursor === -1
      ? null
      : state.turnOrderTeamIds[state.roundTurnCursor] ?? null;
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

export const hasNextRoundTurn = (state: RoomState): boolean => {
  return state.roundTurnCursor + 1 < state.turnOrderTeamIds.length;
};

export const finalizeActiveRoundTurn = (state: RoomState): void => {
  const activeRoundTeamId = state.activeRoundTeamId;

  if (activeRoundTeamId !== null) {
    state.completedRoundTurnTeamIds = [
      ...state.completedRoundTurnTeamIds,
      activeRoundTeamId
    ];
  }

  const nextRoundTurnCursor = state.roundTurnCursor + 1;

  if (nextRoundTurnCursor >= state.turnOrderTeamIds.length) {
    return;
  }

  state.roundTurnCursor = nextRoundTurnCursor;
  state.activeRoundTeamId = state.turnOrderTeamIds[nextRoundTurnCursor] ?? null;
};
