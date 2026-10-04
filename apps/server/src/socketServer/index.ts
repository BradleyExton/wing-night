import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import {
  CLIENT_ROLES,
  SERVER_TO_CLIENT_EVENTS,
  toRoleScopedSnapshotEnvelope,
  type ClientToServerEvents,
  type RoomState,
  type ServerToClientEvents,
  type SocketClientRole
} from "@wingnight/shared";

import {
  applyRoomStateMutation,
  getRoomStateSnapshot
} from "../roomState/index.js";
import { isValidHostSecret, issueHostSecret } from "../hostAuth/index.js";
import { createHostSeatGuard, type SeatedSocketData } from "./hostSeatGuard/index.js";
import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

const ROOM_BY_CLIENT_ROLE = {
  HOST: "role:host",
  DISPLAY: "role:display"
} as const satisfies Record<SocketClientRole, string>;

// The seam for work the server starts on its own behalf — today, RECREATE's
// image generation. Every mutation still goes through `applyRoomStateMutation`
// and every client still learns of it the same way; the only novelty is that
// the trigger is a finished network call rather than a host tap. Listeners
// hear every broadcast, so a side effect can be reconciled against the state
// that was just published instead of guessing from the event that caused it.
export type RoomStateBroadcaster = {
  applyAndBroadcast: (runMutation: () => RoomState) => void;
  onBroadcast: (listener: (roomState: RoomState) => void) => void;
};

type RoomSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  Partial<SeatedSocketData>
>;

export type AttachedSocketServer = {
  socketServer: RoomSocketServer;
  broadcaster: RoomStateBroadcaster;
};

type AttachSocketServerOptions = {
  // Resolved once at boot (`resolveHostControlToken`) and shared with the
  // laptop-only `/host-join` route, which hands it to the host QR.
  hostControlToken: string;
};

export const attachSocketServer = (
  httpServer: HttpServer,
  options: AttachSocketServerOptions
): AttachedSocketServer => {
  const configuredCorsOrigin = process.env.SOCKET_IO_CORS_ORIGIN;
  const corsOrigin =
    configuredCorsOrigin && configuredCorsOrigin.trim().length > 0
      ? configuredCorsOrigin.trim()
      : true;
  const socketServer: RoomSocketServer = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  // The host seat is decided here, before a connection exists: the laptop
  // itself or the host control token, and anything else asking for HOST is
  // turned away with a connect error rather than seated as a display.
  socketServer.use(createHostSeatGuard(options.hostControlToken));

  const broadcastListeners: ((roomState: RoomState) => void)[] = [];

  const emitRoleScopedSnapshotToRoom = (
    clientRole: SocketClientRole,
    roomState: RoomState
  ): void => {
    socketServer
      .to(ROOM_BY_CLIENT_ROLE[clientRole])
      .emit(
        SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT,
        toRoleScopedSnapshotEnvelope(clientRole, roomState)
      );
  };

  const broadcastSnapshot = (roomState: RoomState): void => {
    emitRoleScopedSnapshotToRoom(CLIENT_ROLES.HOST, roomState);
    emitRoleScopedSnapshotToRoom(CLIENT_ROLES.DISPLAY, roomState);

    for (const listener of broadcastListeners) {
      listener(roomState);
    }
  };

  const broadcastAfter = (runMutation: () => RoomState): void => {
    const mutationResult = applyRoomStateMutation(runMutation);

    if (!mutationResult.didMutate) {
      return;
    }

    broadcastSnapshot(mutationResult.roomState);
  };

  socketServer.on("connection", (socket) => {
    // The guard always seats a socket it lets through; the fallbacks are the
    // least-privileged seat, for the type's sake.
    const socketClientRole = socket.data.clientRole ?? CLIENT_ROLES.DISPLAY;
    const isLoopbackPeer = socket.data.isLoopbackPeer ?? false;
    socket.join(ROOM_BY_CLIENT_ROLE[socketClientRole]);

    registerRoomStateHandlers(
      socket,
      () => {
        const roomState = getRoomStateSnapshot();
        return toRoleScopedSnapshotEnvelope(socketClientRole, roomState);
      },
      (_event, _payload, runMutation) => {
        broadcastAfter(runMutation);
      },
      { clientRole: socketClientRole, isLoopbackPeer },
      {
        issueHostSecret,
        isValidHostSecret
      }
    );
  });

  return {
    socketServer,
    broadcaster: {
      applyAndBroadcast: broadcastAfter,
      onBroadcast: (listener) => {
        broadcastListeners.push(listener);
      }
    }
  };
};
