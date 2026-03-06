import { isDeepStrictEqual } from "node:util";
import type { RoomState } from "@wingnight/shared";

import { getRoomStateSnapshot } from "../baseMutations/index.js";

export type RoomStateMutationResult = {
  roomState: RoomState;
  didMutate: boolean;
};

export const applyRoomStateMutation = (
  runMutation: () => RoomState
): RoomStateMutationResult => {
  const previousSnapshot = getRoomStateSnapshot();
  const roomState = runMutation();

  return {
    roomState,
    didMutate: !isDeepStrictEqual(previousSnapshot, roomState)
  };
};
