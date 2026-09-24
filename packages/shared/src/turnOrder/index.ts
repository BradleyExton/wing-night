import { Phase } from "../phase/index.js";
import type { RoomState } from "../roomState/index.js";

type TurnOrderRoomState = Pick<RoomState, "phase" | "currentRound" | "turnOrderTeamIds">;

const resolveRoundTurnOffset = (teamCount: number, roundNumber: number): number => {
  if (teamCount <= 0 || !Number.isInteger(roundNumber) || roundNumber < 1) {
    return 0;
  }

  return (roundNumber - 1) % teamCount;
};

// The first team to play a fresh minigame has watched nobody, so no team is
// always first: round N opens with the base order's (N-1)th team and the rest
// follow in base order, wrapping. `turnOrderTeamIds` on the snapshot is that
// base order (the one the host edits); every surface that shows who plays
// when resolves the round's order through here, never from the base directly.
export const resolveRoundTurnOrderTeamIds = (
  turnOrderTeamIds: readonly string[],
  roundNumber: number
): string[] => {
  if (turnOrderTeamIds.length === 0) {
    return [];
  }

  const offset = resolveRoundTurnOffset(turnOrderTeamIds.length, roundNumber);

  return [...turnOrderTeamIds.slice(offset), ...turnOrderTeamIds.slice(0, offset)];
};

// The inverse: a host arranges the list they see (the round's order) and the
// server keeps the base order that produces it.
export const resolveBaseTurnOrderTeamIds = (
  roundTurnOrderTeamIds: readonly string[],
  roundNumber: number
): string[] => {
  if (roundTurnOrderTeamIds.length === 0) {
    return [];
  }

  const offset = resolveRoundTurnOffset(roundTurnOrderTeamIds.length, roundNumber);
  const pivot = roundTurnOrderTeamIds.length - offset;

  return [
    ...roundTurnOrderTeamIds.slice(pivot),
    ...roundTurnOrderTeamIds.slice(0, pivot)
  ];
};

// Which round's order the room is showing: the one in progress, or, on the
// two beats where no round is under way, the one about to start. Before
// round one `currentRound` is 0, so INTRO and SETUP resolve to round one.
export const resolveTurnOrderRoundNumber = (
  state: Pick<RoomState, "phase" | "currentRound">
): number => {
  if (state.phase === Phase.ROUND_RESULTS) {
    return state.currentRound + 1;
  }

  return Math.max(1, state.currentRound);
};

export const resolveRoomTurnOrderTeamIds = (state: TurnOrderRoomState): string[] => {
  return resolveRoundTurnOrderTeamIds(
    state.turnOrderTeamIds,
    resolveTurnOrderRoundNumber(state)
  );
};
