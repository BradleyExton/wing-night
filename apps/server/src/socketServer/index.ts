import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import type {
  IncomingSocketEvents,
  OutgoingSocketEvents
} from "../socketContracts/index.js";
import { getRoomStateSnapshot } from "../roomState/index.js";
import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

export const attachSocketServer = (
  httpServer: HttpServer
): Server<IncomingSocketEvents, OutgoingSocketEvents> => {
  const socketServer = new Server<IncomingSocketEvents, OutgoingSocketEvents>(
    httpServer,
    {
      cors: {
        origin: true,
        credentials: true
      }
    }
  );

  socketServer.on("connection", (socket) => {
    registerRoomStateHandlers(socket, getRoomStateSnapshot);
  });

  return socketServer;
};
