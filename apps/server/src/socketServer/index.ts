import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
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
    const broadcastAfter = (runMutation: () => ReturnType<typeof getRoomStateSnapshot>): void => {
      socketServer.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, runMutation());
    };
    const withBroadcast =
      <TArgs extends unknown[]>(
        mutation: (...args: TArgs) => ReturnType<typeof getRoomStateSnapshot>
      ) =>
      (...args: TArgs): void => {
        broadcastAfter(() => mutation(...args));
      };

    const authorizedMutationHandlers = {
      onAuthorizedNextPhase: withBroadcast(advanceRoomStatePhase),
      onAuthorizedSkipTurnBoundary: withBroadcast(skipTurnBoundary),
      onAuthorizedReorderTurnOrder: withBroadcast(reorderTurnOrder),
      onAuthorizedResetGame: withBroadcast(resetGameToSetup),
      onAuthorizedCreateTeam: withBroadcast(createTeam),
      onAuthorizedAssignPlayer: withBroadcast(assignPlayerToTeam),
      onAuthorizedSetWingParticipation: withBroadcast(setWingParticipation),
      onAuthorizedAdjustTeamScore: withBroadcast(adjustTeamScore),
      onAuthorizedRedoLastMutation: withBroadcast(redoLastScoringMutation),
      onAuthorizedRecordTriviaAttempt: withBroadcast(recordTriviaAttempt),
      onAuthorizedPauseTimer: withBroadcast(pauseRoomTimer),
      onAuthorizedResumeTimer: withBroadcast(resumeRoomTimer),
      onAuthorizedExtendTimer: withBroadcast(extendRoomTimer)
    };

    registerRoomStateHandlers(
      socket,
      getRoomStateSnapshot,
      authorizedMutationHandlers,
      socketClientRole === CLIENT_ROLES.HOST,
      {
        issueHostSecret,
        isValidHostSecret
      }
    );
  });

  return socketServer;
};
