import { resolveRoomTurnOrderTeamIds } from "@wingnight/shared";
import type { RoomState } from "@wingnight/shared";

const ensureTurnOrderTeamIds = (state: RoomState): void => {
  if (state.turnOrderTeamIds.length > 0) {
    return;
  }

  state.turnOrderTeamIds = state.teams.map((team) => team.id);
};

// `roundTurnCursor` is a position within the round, never an index into the
// base order: the round's order is the base rotated for `currentRound`, so the
// same cursor lands on a different team each round. Both lists are the same
// length, which is what keeps `roundTurnCursor + 1 < turnOrderTeamIds.length`
// a true "another turn remains" test wherever it is read.
const resolveTeamIdAtRoundCursor = (state: RoomState, cursor: number): string | null => {
  if (cursor < 0) {
    return null;
  }

  return resolveRoomTurnOrderTeamIds(state)[cursor] ?? null;
};

export const initializeRoundTurnState = (state: RoomState): void => {
  ensureTurnOrderTeamIds(state);
  state.roundTurnCursor = state.turnOrderTeamIds.length > 0 ? 0 : -1;
  state.completedRoundTurnTeamIds = [];
  state.activeRoundTeamId = resolveTeamIdAtRoundCursor(state, state.roundTurnCursor);
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
  state.activeRoundTeamId = resolveTeamIdAtRoundCursor(state, nextRoundTurnCursor);
};
