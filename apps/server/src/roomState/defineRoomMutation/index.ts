import type { Phase, RoomState } from "@wingnight/shared";

import { syncContestantTurn } from "../contestantTurnState/index.js";
import { getRoomStateSnapshot } from "../getRoomStateSnapshot/index.js";
import { reportRoomStateMutation } from "../mutationResult/index.js";
import { isRoomInFatalState } from "../selectors/index.js";
import { getRoomState } from "../stateStore/index.js";

type RoomMutationDefinition<TArgs extends unknown[]> = {
  requiredPhase?: Phase | Phase[];
  // Performs validation + mutation against the live room state and returns
  // whether it actually mutated. Rejection paths must return false.
  run: (roomState: RoomState, ...args: TArgs) => boolean;
};

// Wraps a room mutation with the shared ceremony: fatal-state check, optional
// phase precondition, didMutate reporting, and always returning the snapshot.
// A mutation that moved the room also re-derives the arcade turn's leg in hand
// and its controller (`syncContestantTurn`), so whose leg it is and which
// device writes it can never lag the change that moved it — a leg ending, a
// phase advancing, an undo, a phone waking.
export const defineRoomMutation = <TArgs extends unknown[]>(
  definition: RoomMutationDefinition<TArgs>
): ((...args: TArgs) => RoomState) => {
  const requiredPhases =
    definition.requiredPhase === undefined
      ? null
      : Array.isArray(definition.requiredPhase)
        ? definition.requiredPhase
        : [definition.requiredPhase];

  return (...args: TArgs): RoomState => {
    const roomState = getRoomState();

    if (isRoomInFatalState(roomState)) {
      return getRoomStateSnapshot();
    }

    if (requiredPhases !== null && !requiredPhases.includes(roomState.phase)) {
      return getRoomStateSnapshot();
    }

    if (definition.run(roomState, ...args)) {
      syncContestantTurn(roomState);
      reportRoomStateMutation();
    }

    return getRoomStateSnapshot();
  };
};
