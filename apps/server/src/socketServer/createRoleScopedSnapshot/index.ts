import {
  CLIENT_ROLES,
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
