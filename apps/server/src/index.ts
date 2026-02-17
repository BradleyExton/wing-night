import { createServer } from "node:http";

import { createApp } from "./createApp/index.js";
import { logError, logInfo } from "./logger/index.js";
import { setRoomStatePlayers } from "./roomState/index.js";
import { attachSocketServer } from "./socketServer/index.js";
import { loadPlayers } from "./contentLoader/loadPlayers/index.js";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const app = createApp();
const httpServer = createServer(app);

try {
  const players = loadPlayers();
  setRoomStatePlayers(players);
} catch (error) {
  logError("server:playersContentLoadFailed", error);
  process.exit(1);
}

attachSocketServer(httpServer);

httpServer
  .listen(port, () => {
    logInfo("server:startup", {
      url: `http://localhost:${port}`
    });
  })
  .on("error", (error) => {
    logError("server:startupFailed", error);
    process.exit(1);
  });
