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
  assignPlayerToTeam,
  createTeam,
  getRoomStateSnapshot,
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

    registerRoomStateHandlers(
      socket,
      getRoomStateSnapshot,
      {
        onAuthorizedNextPhase: () => {
          const updatedSnapshot = advanceRoomStatePhase();
          socketServer.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, updatedSnapshot);
        },
        onAuthorizedCreateTeam: (name) => {
          const updatedSnapshot = createTeam(name);
          socketServer.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, updatedSnapshot);
        },
        onAuthorizedAssignPlayer: (playerId, teamId) => {
          const updatedSnapshot = assignPlayerToTeam(playerId, teamId);
          socketServer.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, updatedSnapshot);
        },
        onAuthorizedSetWingParticipation: (playerId, didEat) => {
          const updatedSnapshot = setWingParticipation(playerId, didEat);
          socketServer.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, updatedSnapshot);
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
