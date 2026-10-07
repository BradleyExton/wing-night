import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import {
  CLIENT_ROLES,
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS,
  readPlayerHandshake,
  toRoleScopedSnapshotEnvelope,
  type ClientToServerEvents,
  type RoomState,
  type ServerToClientEvents,
  type SocketClientRole
} from "@wingnight/shared";

import type { SerializableValue } from "@wingnight/minigames-core";

import { createMinigameDeadlineScheduler } from "../minigames/deadlineScheduler/index.js";
import {
  applyRoomStateMutation,
  dispatchContestantMinigameAction,
  dispatchServerMinigameAction,
  getRoomPlayers,
  getRoomStateSnapshot,
  readContestantActionRefusal,
  readMinigameDeadline,
  syncPlayerClaimFlags
} from "../roomState/index.js";
import { isValidHostSecret, issueHostSecret } from "../hostAuth/index.js";
import { playerClaimStore } from "../playerClaims/index.js";
import { isLoopbackAddress } from "../utils/loopbackPeer/index.js";
import { createTrailingCoalescer } from "../utils/trailingCoalescer/index.js";
import { registerPlayerHandlers, resolvePlayerRoom } from "./registerPlayerHandlers/index.js";
import { resolveContestantHostViewDelivery } from "./contestantHostView/index.js";
import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";
import { createSeatGuard, type SeatedSocketData } from "./seatGuard/index.js";

const ROOM_BY_CLIENT_ROLE = {
  HOST: "role:host",
  DISPLAY: "role:display",
  PLAYER: "role:player"
} as const satisfies Record<SocketClientRole, string>;

// The displays running on the laptop itself — the TV — and nothing else. The
// player join token goes to this room alone: a display opened on a guest's
// phone over the Wi-Fi is a DISPLAY too, and must never be handed the key the
// QR carries (it could seat phones the room never saw scan in).
const LAPTOP_DISPLAY_ROOM = "role:display:laptop";

// Claim flags (who is claimed, who is awake) reach the room at most once per
// window, on the trailing edge: a phone toggling a face as fast as it can is
// one snapshot to the TV per tenth of a second, not one per tap.
export const CLAIM_FLAG_SYNC_WINDOW_MS = 100;

const IPV4_MAPPED_PREFIX = "::ffff:";

// The Wi-Fi address a phone claims from, which caps it at one face. The
// laptop itself is exempt (null): the host testing phones in several tabs is
// not hoarding.
const resolvePlayerPeerAddress = (address: string | undefined): string | null => {
  if (address === undefined || address.length === 0 || isLoopbackAddress(address)) {
    return null;
  }

  const normalized = address.toLowerCase();

  return normalized.startsWith(IPV4_MAPPED_PREFIX) ? normalized.slice(IPV4_MAPPED_PREFIX.length) : normalized;
};

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

  // Every seat is decided here, before a connection exists: HOST is the
  // laptop itself or the host control token, PLAYER is the current join token,
  // and anything asking for either without it is turned away with a connect
  // error rather than seated as a display.
  socketServer.use(
    createSeatGuard({
      hostControlToken: options.hostControlToken,
      isPlayerJoinToken: playerClaimStore.isJoinToken,
      isPlayerClaimSecret: playerClaimStore.isClaimSecret
    })
  );

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

  // The contestant's phone plays from the game's host view, which no shared snapshot carries:
  // it goes to that one player's room, and only while their phone holds the leg in hand
  // (`resolveContestantHostViewDelivery`).
  const emitContestantHostView = (roomState: RoomState, onlyPlayerId: string | null = null): void => {
    const delivery = resolveContestantHostViewDelivery(roomState);

    if (delivery === null || (onlyPlayerId !== null && delivery.playerId !== onlyPlayerId)) {
      return;
    }

    socketServer
      .to(resolvePlayerRoom(delivery.playerId))
      .emit(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW, delivery.payload);
  };

  // Forward-declared: the deadline's action is itself a broadcast, so the scheduler and the
  // broadcast each need the other.
  let reconcileDeadline = (): void => {};

  const broadcastSnapshot = (roomState: RoomState): void => {
    emitRoleScopedSnapshotToRoom(CLIENT_ROLES.HOST, roomState);
    emitRoleScopedSnapshotToRoom(CLIENT_ROLES.DISPLAY, roomState);
    emitRoleScopedSnapshotToRoom(CLIENT_ROLES.PLAYER, roomState);
    emitContestantHostView(roomState);
    reconcileDeadline();

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

  const claimFlagSync = createTrailingCoalescer(() => {
    broadcastAfter(syncPlayerClaimFlags);
  }, CLAIM_FLAG_SYNC_WINDOW_MS);

  // A game's deadline (FAPPY's relay limit) on the server's own clock, so it lands with the
  // phone that was flying the leg gone.
  const deadlineScheduler = createMinigameDeadlineScheduler({
    readDeadline: readMinigameDeadline,
    fire: (deadline, receivedAtMs) => {
      broadcastAfter(() =>
        dispatchServerMinigameAction(deadline.minigameId, deadline.actionType, receivedAtMs)
      );
    }
  });

  reconcileDeadline = deadlineScheduler.reconcile;

  const emitPlayerJoinToken = (joinToken: string): void => {
    socketServer.to(LAPTOP_DISPLAY_ROOM).emit(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN, {
      joinToken
    });
  };

  // A face taken off a phone by anything but that phone (the host, a roster
  // rewrite, a reset, the same secret on another socket, "this isn't me" in
  // another tab, another face claimed from the same phone): the holder is told
  // why and leaves the room only the current holder may be in. A phone that
  // was asleep has no socket to tell — it learns when it reconnects.
  const unsubscribeClaimReleased = playerClaimStore.onClaimReleased(({ playerId, socketId, reason }) => {
    const socket = socketId === null ? undefined : socketServer.sockets.sockets.get(socketId);

    if (socket === undefined) {
      return;
    }

    socket.leave(resolvePlayerRoom(playerId));
    socket.emit(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, { playerId, reason });
  });
  // The join token rotated (Reset Game, or the host's new code): the TV
  // redraws its QR at once, and every phone socket that holds no face is let
  // go — it joined on the old code, and a new code is joined by scanning it,
  // not by a socket that stayed open. A phone holding a face keeps its socket
  // (and reconnects on its claim secret). After a reset no phone holds one:
  // each was told its face is gone before the rotation, so every phone goes.
  // A server-side disconnect is never retried by the client.
  const unsubscribeJoinTokenRotated = playerClaimStore.onJoinTokenRotated((joinToken) => {
    emitPlayerJoinToken(joinToken);

    for (const socketId of socketServer.sockets.adapter.rooms.get(ROOM_BY_CLIENT_ROLE.PLAYER) ?? []) {
      if (!playerClaimStore.isSocketSeated(socketId)) {
        socketServer.sockets.sockets.get(socketId)?.disconnect(true);
      }
    }
  });

  httpServer.once("close", () => {
    unsubscribeClaimReleased();
    unsubscribeJoinTokenRotated();
    claimFlagSync.cancel();
    deadlineScheduler.cancel();
  });

  socketServer.on("connection", (socket) => {
    // The guard always seats a socket it lets through; the fallbacks are the
    // least-privileged seat, for the type's sake.
    const socketClientRole = socket.data.clientRole ?? CLIENT_ROLES.DISPLAY;
    const isLoopbackPeer = socket.data.isLoopbackPeer ?? false;
    socket.join(ROOM_BY_CLIENT_ROLE[socketClientRole]);

    if (socketClientRole === CLIENT_ROLES.DISPLAY && isLoopbackPeer) {
      const emitJoinTokenToThisDisplay = (): void => {
        socket.emit(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN, {
          joinToken: playerClaimStore.getJoinToken()
        });
      };

      socket.join(LAPTOP_DISPLAY_ROOM);
      emitJoinTokenToThisDisplay();
      // The page's listener may attach after that first emit landed; it asks.
      socket.on(CLIENT_TO_SERVER_EVENTS.REQUEST_PLAYER_JOIN_TOKEN, emitJoinTokenToThisDisplay);
    }

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

    if (socketClientRole === CLIENT_ROLES.PLAYER) {
      const connection = {
        handshake: readPlayerHandshake(socket.handshake.auth),
        peerAddress: resolvePlayerPeerAddress(socket.handshake.address)
      };

      registerPlayerHandlers(socket, connection, {
        claimStore: playerClaimStore,
        getPlayers: getRoomPlayers,
        emitPlayerSelf: (playerId) => {
          socketServer
            .to(resolvePlayerRoom(playerId))
            .emit(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF, { playerId });
        },
        emitContestantHostView: (playerId) => {
          emitContestantHostView(getRoomStateSnapshot(), playerId);
        },
        dispatchMinigameAction: (playerId, action) => {
          const refusal = readContestantActionRefusal(playerId, action.minigameId, action.actionType);

          if (refusal !== null) {
            return { ok: false, reason: refusal };
          }

          broadcastAfter(() =>
            dispatchContestantMinigameAction(
              playerId,
              action.minigameId,
              action.actionType,
              // The game's reducer guards its own payloads, exactly as it does the tablet's.
              action.actionPayload as SerializableValue
            )
          );

          return { ok: true };
        },
        syncClaimFlags: claimFlagSync.schedule
      });
    }
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
