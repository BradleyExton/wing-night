import { createServer } from "node:http";

import {
  resolveContentLayerDirs,
  resolveContentRootDir
} from "./contentLoader/contentLoaderUtils/index.js";
import { createApp } from "./createApp/index.js";
import { logError, logInfo } from "./logger/index.js";
import { reloadContentIntoRoomState } from "./reloadContentIntoRoomState/index.js";
import { setRoomStateFatalError } from "./roomState/index.js";
import { attachSocketServer } from "./socketServer/index.js";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const contentRootDir = resolveContentRootDir();
const app = createApp({ contentRootDir });

// Named at boot because the root is now resolved rather than fixed — it is the
// night pack when one exists, the repo's content/ otherwise, and whatever
// WN_CONTENT_ROOT_DIR says when it is set. A server quietly reading the wrong
// content looks exactly like a server reading the right content, right up
// until the roster on the TV is the sample one.
logInfo("server:contentRoot", {
  contentRootDir,
  layerDirs: resolveContentLayerDirs(contentRootDir)
});
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
