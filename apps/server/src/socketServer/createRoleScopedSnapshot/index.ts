import {
  CLIENT_ROLES,
  DISPLAY_UNSAFE_ROOM_STATE_KEYS,
  type DisplayRoomStateSnapshot,
  type RoleScopedStateSnapshotEnvelope,
  type RoomState,
  type SocketClientRole
} from "@wingnight/shared";

const createDisplayRoomStateSnapshot = (
  roomState: RoomState
): DisplayRoomStateSnapshot => {
  const {
    triviaPrompts: _triviaPrompts,
    currentTriviaPrompt: _currentTriviaPrompt,
    minigameHostView: _minigameHostView,
    ...displayRoomState
  } = roomState;

  if (process.env.NODE_ENV !== "production") {
    for (const unsafeKey of DISPLAY_UNSAFE_ROOM_STATE_KEYS) {
      if (unsafeKey in displayRoomState) {
        throw new Error(`Display snapshot leaked host-only field: ${unsafeKey}`);
      }
    }
  }

  return displayRoomState;
};

export const createRoleScopedSnapshot = (
  roomState: RoomState,
  clientRole: SocketClientRole
): RoleScopedStateSnapshotEnvelope => {
  if (clientRole === CLIENT_ROLES.HOST) {
    return {
      clientRole: CLIENT_ROLES.HOST,
      roomState
    };
  }

  return {
    clientRole: CLIENT_ROLES.DISPLAY,
    roomState: createDisplayRoomStateSnapshot(roomState)
  };
};
