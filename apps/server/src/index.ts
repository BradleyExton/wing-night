import { createServer } from "node:http";
import type { MinigameType } from "@wingnight/shared";
import { isSerializableValue } from "@wingnight/minigames-core";

import { createApp } from "./createApp/index.js";
import { loadContent } from "./contentLoader/index.js";
import { logError, logInfo } from "./logger/index.js";
import {
  setRoomStateFatalError,
  setRoomStateGameConfig,
  setRoomStateMinigameContent,
  setRoomStatePlayers,
} from "./roomState/index.js";
import { attachSocketServer } from "./socketServer/index.js";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const app = createApp();
const httpServer = createServer(app);

try {
  const { players, gameConfig, minigameContentById } = loadContent();
  setRoomStatePlayers(players);
  setRoomStateGameConfig(gameConfig);

  for (const [minigameId, minigameContent] of Object.entries(
    minigameContentById
  ) as [MinigameType, unknown][]) {
    if (minigameContent === undefined || !isSerializableValue(minigameContent)) {
      continue;
    }

    setRoomStateMinigameContent(minigameId, minigameContent);
  }
} catch (error) {
  logError("server:contentLoadFailed", error);
  const failureReason = error instanceof Error ? error.message : String(error);
  setRoomStateFatalError(failureReason);
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
