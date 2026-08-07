import { createServer } from "node:http";

import { createApp } from "./createApp/index.js";
import { logError, logInfo } from "./logger/index.js";
import { reloadContentIntoRoomState } from "./reloadContentIntoRoomState/index.js";
import { setRoomStateFatalError } from "./roomState/index.js";
import { attachSocketServer } from "./socketServer/index.js";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const app = createApp();
const httpServer = createServer(app);

// Boot's failure policy: a server whose content will not load should not
// pretend to be usable, so it takes the destructive fatalError path. Apply
// makes the opposite choice on the same failure — see
// `reloadContentIntoRoomState`.
const bootReloadResult = reloadContentIntoRoomState();

if (!bootReloadResult.ok) {
  logError("server:contentLoadFailed", bootReloadResult.reason);
  setRoomStateFatalError(bootReloadResult.reason);
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
