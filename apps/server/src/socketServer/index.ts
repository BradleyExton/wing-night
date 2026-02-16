import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import type {
  IncomingSocketEvents,
  OutgoingSocketEvents
} from "../socketContracts/index.js";
import { getRoomStateSnapshot } from "../roomState/index.js";
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

  socketServer.on("connection", (socket) => {
    registerRoomStateHandlers(
      socket,
      getRoomStateSnapshot,
      () => {
        // Phase mutation wiring is added in task 3.1.
      },
      {
        issueHostSecret,
        isValidHostSecret
      }
    );
  });

  return socketServer;
};
