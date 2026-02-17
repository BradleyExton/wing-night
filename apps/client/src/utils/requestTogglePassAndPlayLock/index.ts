import {
  CLIENT_TO_SERVER_EVENTS,
  type MinigameTogglePassAndPlayLockPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { readHostSecret } from "../hostSecretStorage";

type TogglePassAndPlayLockSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestTogglePassAndPlayLock = (
  socket: TogglePassAndPlayLockSocket,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const hostSecret = getHostSecret();

  if (!hostSecret) {
    onMissingHostSecret?.();
    return false;
  }

  const payload: MinigameTogglePassAndPlayLockPayload = {
    hostSecret
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.TOGGLE_PASS_AND_PLAY_LOCK, payload);

  return true;
};
