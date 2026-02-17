import { createServer } from "node:http";

import { createApp } from "./createApp/index.js";
import { loadContent } from "./contentLoader/index.js";
import { logError, logInfo } from "./logger/index.js";
import {
  setRoomStateGameConfig,
  setRoomStatePlayers,
  setRoomStateTriviaPrompts
} from "./roomState/index.js";
import { attachSocketServer } from "./socketServer/index.js";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const app = createApp();
const httpServer = createServer(app);

try {
  const { players, gameConfig, triviaPrompts } = loadContent();
  setRoomStatePlayers(players);
  setRoomStateGameConfig(gameConfig);
  setRoomStateTriviaPrompts(triviaPrompts);
} catch (error) {
  logError("server:contentLoadFailed", error);
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
