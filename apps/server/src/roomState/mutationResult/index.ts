import type { RoomState } from "@wingnight/shared";

export type RoomStateMutationResult = {
  roomState: RoomState;
  didMutate: boolean;
};

// Room mutations report through this module-scoped flag instead of a
// full-state deep comparison; `defineRoomMutation` raises it whenever a
// mutation's `run` signals that it changed room state.
let didReportRoomStateMutation = false;

export const reportRoomStateMutation = (): void => {
  didReportRoomStateMutation = true;
};

export const applyRoomStateMutation = (
  runMutation: () => RoomState
): RoomStateMutationResult => {
  didReportRoomStateMutation = false;
  const roomState = runMutation();

  return {
    roomState,
    didMutate: didReportRoomStateMutation
  };
};
