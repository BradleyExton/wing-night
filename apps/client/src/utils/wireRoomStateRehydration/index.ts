import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS,
  type RoleScopedSnapshotByRole,
  type RoleScopedStateSnapshotEnvelope,
  type SocketClientRole
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";

type RoomStateSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit" | "connected"
> & {
  recovered?: boolean;
};

export const wireRoomStateRehydration = <TRole extends SocketClientRole>(
  socket: RoomStateSocket,
  expectedRole: TRole,
  onSnapshot: (roomState: RoleScopedSnapshotByRole<TRole>) => void
): (() => void) => {
  const requestLatestState = (): void => {
    socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE);
  };

  const handleSnapshot = (payload: RoleScopedStateSnapshotEnvelope): void => {
    if (payload.clientRole !== expectedRole) {
      return;
    }

    onSnapshot(payload.roomState as RoleScopedSnapshotByRole<TRole>);
  };

  const handleConnect = (): void => {
    if (socket.recovered === false) {
      requestLatestState();
    }
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, handleSnapshot);
  socket.on("connect", handleConnect);

  if (socket.connected) {
    requestLatestState();
  }

  return (): void => {
    socket.off(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, handleSnapshot);
    socket.off("connect", handleConnect);
  };
};
