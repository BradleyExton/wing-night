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

export const finalizeActiveRoundTurn = (state: RoomState): void => {
  const activeRoundTeamId = state.activeRoundTeamId;

  if (activeRoundTeamId !== null) {
    state.completedRoundTurnTeamIds = [
      ...state.completedRoundTurnTeamIds,
      activeRoundTeamId
    ];
  }

  const nextRoundTurnCursor = state.roundTurnCursor + 1;
  const hasNextRoundTurn = nextRoundTurnCursor < state.turnOrderTeamIds.length;

  if (!hasNextRoundTurn) {
    return;
  }

  state.roundTurnCursor = nextRoundTurnCursor;
  state.activeRoundTeamId = state.turnOrderTeamIds[nextRoundTurnCursor] ?? null;
};
