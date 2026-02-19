import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import {
  CLIENT_ROLES,
  SERVER_TO_CLIENT_EVENTS,
  isSocketClientRole,
  type SocketClientRole
} from "@wingnight/shared";

import type {
  IncomingSocketEvents,
  OutgoingSocketEvents
} from "../socketContracts/index.js";
import {
  advanceRoomStatePhase,
  adjustTeamScore,
  assignPlayerToTeam,
  createTeam,
  extendRoomTimer,
  getRoomStateSnapshot,
  pauseRoomTimer,
  recordTriviaAttempt,
  redoLastScoringMutation,
  reorderTurnOrder,
  resetGameToSetup,
  skipTurnBoundary,
  resumeRoomTimer,
  setWingParticipation
} from "../roomState/index.js";
import { isValidHostSecret, issueHostSecret } from "../hostAuth/index.js";
import { createRoleScopedSnapshot } from "./createRoleScopedSnapshot/index.js";
import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

export const attachSocketServer = (
  httpServer: HttpServer
): Server<IncomingSocketEvents, OutgoingSocketEvents> => {
  const configuredCorsOrigin = process.env.SOCKET_IO_CORS_ORIGIN;
  const corsOrigin =
    configuredCorsOrigin && configuredCorsOrigin.trim().length > 0
      ? configuredCorsOrigin.trim()
      : true;

  const socketServer = new Server<IncomingSocketEvents, OutgoingSocketEvents>(
    httpServer,
    {
      cors: {
        origin: corsOrigin,
        credentials: true
      }
    }
  );

  const resolveSocketClientRole = (authPayload: unknown): SocketClientRole => {
    if (typeof authPayload !== "object" || authPayload === null) {
      return CLIENT_ROLES.DISPLAY;
    }

    if (!("clientRole" in authPayload)) {
      return CLIENT_ROLES.DISPLAY;
    }

    const { clientRole } = authPayload;

    if (!isSocketClientRole(clientRole)) {
      return CLIENT_ROLES.DISPLAY;
    }

    return clientRole;
  };

  socketServer.on("connection", (socket) => {
    const socketClientRole = resolveSocketClientRole(socket.handshake.auth);

    const emitRoleScopedSnapshot = (
      targetSocket: Socket<IncomingSocketEvents, OutgoingSocketEvents>,
      roomStateSnapshot: ReturnType<typeof getRoomStateSnapshot>
    ): void => {
      const targetRole = resolveSocketClientRole(targetSocket.handshake.auth);
      targetSocket.emit(
        SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT,
        createRoleScopedSnapshot(roomStateSnapshot, targetRole)
      );
    };

    const broadcastRoleScopedSnapshot = (
      roomStateSnapshot: ReturnType<typeof getRoomStateSnapshot>
    ): void => {
      for (const connectedSocket of socketServer.sockets.sockets.values()) {
        emitRoleScopedSnapshot(connectedSocket, roomStateSnapshot);
      }
    };

    registerRoomStateHandlers(
      socket,
      () => createRoleScopedSnapshot(getRoomStateSnapshot(), socketClientRole),
      {
        onAuthorizedNextPhase: () => {
          broadcastRoleScopedSnapshot(advanceRoomStatePhase());
        },
        onAuthorizedSkipTurnBoundary: () => {
          broadcastRoleScopedSnapshot(skipTurnBoundary());
        },
        onAuthorizedReorderTurnOrder: (teamIds) => {
          broadcastRoleScopedSnapshot(reorderTurnOrder(teamIds));
        },
        onAuthorizedResetGame: () => {
          broadcastRoleScopedSnapshot(resetGameToSetup());
        },
        onAuthorizedCreateTeam: (name) => {
          broadcastRoleScopedSnapshot(createTeam(name));
        },
        onAuthorizedAssignPlayer: (playerId, teamId) => {
          broadcastRoleScopedSnapshot(assignPlayerToTeam(playerId, teamId));
        },
        onAuthorizedSetWingParticipation: (playerId, didEat) => {
          broadcastRoleScopedSnapshot(setWingParticipation(playerId, didEat));
        },
        onAuthorizedAdjustTeamScore: (teamId, delta) => {
          broadcastRoleScopedSnapshot(adjustTeamScore(teamId, delta));
        },
        onAuthorizedRedoLastMutation: () => {
          broadcastRoleScopedSnapshot(redoLastScoringMutation());
        },
        onAuthorizedRecordTriviaAttempt: (isCorrect) => {
          broadcastRoleScopedSnapshot(recordTriviaAttempt(isCorrect));
        },
        onAuthorizedPauseTimer: () => {
          broadcastRoleScopedSnapshot(pauseRoomTimer());
        },
        onAuthorizedResumeTimer: () => {
          broadcastRoleScopedSnapshot(resumeRoomTimer());
        },
        onAuthorizedExtendTimer: (additionalSeconds) => {
          broadcastRoleScopedSnapshot(extendRoomTimer(additionalSeconds));
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
