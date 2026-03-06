import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { SerializableValue } from "@wingnight/minigames-core";
import {
  CLIENT_ROLES,
  MINIGAME_API_VERSION,
  SERVER_TO_CLIENT_EVENTS,
  toRoleScopedSnapshotEnvelope,
  type RoomState,
  type SocketClientRole
} from "@wingnight/shared";

import type {
  IncomingSocketEvents,
  OutgoingSocketEvents
} from "../socketContracts/index.js";
import {
  addPlayer,
  advanceRoomStatePhase,
  adjustTeamScore,
  assignPlayerToTeam,
  autoAssignRemainingPlayers,
  createTeam,
  dispatchMinigameAction,
  extendRoomTimer,
  getRoomStateSnapshot,
  pauseRoomTimer,
  redoLastScoringMutation,
  reorderTurnOrder,
  resetGameToSetup,
  skipTurnBoundary,
  resumeRoomTimer,
  setWingParticipation
} from "../roomState/index.js";
import { isValidHostSecret, issueHostSecret } from "../hostAuth/index.js";
import { resolveMinigameDescriptor } from "../minigames/registry/index.js";
import {
  resolveAuthorizedSocketClientRole,
  resolveConfiguredHostControlToken
} from "./resolveAuthorizedSocketClientRole/index.js";
import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

const ROOM_BY_CLIENT_ROLE = {
  HOST: "role:host",
  DISPLAY: "role:display"
} as const satisfies Record<SocketClientRole, string>;

export const attachSocketServer = (
  httpServer: HttpServer
): Server<IncomingSocketEvents, OutgoingSocketEvents> => {
  const configuredCorsOrigin = process.env.SOCKET_IO_CORS_ORIGIN;
  const corsOrigin =
    configuredCorsOrigin && configuredCorsOrigin.trim().length > 0
      ? configuredCorsOrigin.trim()
      : true;
  const configuredHostControlToken = resolveConfiguredHostControlToken(
    process.env.HOST_CONTROL_TOKEN
  );

  const socketServer = new Server<IncomingSocketEvents, OutgoingSocketEvents>(
    httpServer,
    {
      cors: {
        origin: corsOrigin,
        credentials: true
      }
    }
  );

  socketServer.on("connection", (socket) => {
    const socketClientRole = resolveAuthorizedSocketClientRole(
      socket.handshake.auth,
      socket.handshake.address,
      configuredHostControlToken
    );
    socket.join(ROOM_BY_CLIENT_ROLE[socketClientRole]);

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
    };

    const broadcastAfter = (runMutation: () => RoomState): void => {
      broadcastSnapshot(runMutation());
    };

    registerRoomStateHandlers(
      socket,
      () => {
        const roomState = getRoomStateSnapshot();
        return toRoleScopedSnapshotEnvelope(socketClientRole, roomState);
      },
      {
        onAuthorizedNextPhase: () => {
          broadcastAfter(() => advanceRoomStatePhase());
        },
        onAuthorizedSkipTurnBoundary: () => {
          broadcastAfter(() => skipTurnBoundary());
        },
        onAuthorizedReorderTurnOrder: (teamIds) => {
          broadcastAfter(() => reorderTurnOrder(teamIds));
        },
        onAuthorizedResetGame: () => {
          broadcastAfter(() => resetGameToSetup());
        },
        onAuthorizedCreateTeam: (name) => {
          broadcastAfter(() => createTeam(name));
        },
        onAuthorizedAddPlayer: (name) => {
          broadcastAfter(() => addPlayer(name));
        },
        onAuthorizedAssignPlayer: (playerId, teamId) => {
          broadcastAfter(() => assignPlayerToTeam(playerId, teamId));
        },
        onAuthorizedAutoAssignRemainingPlayers: () => {
          broadcastAfter(() => autoAssignRemainingPlayers());
        },
        onAuthorizedSetWingParticipation: (playerId, didEat) => {
          broadcastAfter(() => setWingParticipation(playerId, didEat));
        },
        onAuthorizedAdjustTeamScore: (teamId, delta) => {
          broadcastAfter(() => adjustTeamScore(teamId, delta));
        },
        onAuthorizedRedoLastMutation: () => {
          broadcastAfter(() => redoLastScoringMutation());
        },
        onAuthorizedMinigameAction: (payload) => {
          if (payload.minigameApiVersion !== MINIGAME_API_VERSION) {
            return;
          }

          const currentSnapshot = getRoomStateSnapshot();

          if (currentSnapshot.currentRoundConfig?.minigame !== payload.minigameId) {
            return;
          }

          const activeMinigameDescriptor = resolveMinigameDescriptor(payload.minigameId);

          if (
            activeMinigameDescriptor.metadata.minigameApiVersion !==
            payload.minigameApiVersion
          ) {
            return;
          }
          broadcastAfter(() =>
            dispatchMinigameAction(
              payload.minigameId,
              payload.actionType,
              payload.actionPayload as SerializableValue
            )
          );
        },
        onAuthorizedPauseTimer: () => {
          broadcastAfter(() => pauseRoomTimer());
        },
        onAuthorizedResumeTimer: () => {
          broadcastAfter(() => resumeRoomTimer());
        },
        onAuthorizedExtendTimer: (additionalSeconds) => {
          broadcastAfter(() => extendRoomTimer(additionalSeconds));
        }
      },
      socketClientRole === CLIENT_ROLES.HOST,
      {
        issueHostSecret,
        isValidHostSecret
      }
    );
  });

  return socketServer;
};
