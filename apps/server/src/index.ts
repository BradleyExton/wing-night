import { createServer } from "node:http";

import {
  resolveContentLayerDirs,
  resolveContentRootDir
} from "./contentLoader/contentLoaderUtils/index.js";
import { createApp } from "./createApp/index.js";
import {
  createGeminiImageEditor,
  resolveGeminiApiKey
} from "./imageGeneration/geminiImageEditor/index.js";
import { logError, logInfo } from "./logger/index.js";
import { createRecreateGenerationRunner } from "./minigames/recreateGeneration/index.js";
import { resolveRecreateAttemptGenerator } from "./minigames/recreateGeneration/resolveRecreateAttemptGenerator/index.js";
import { reloadContentIntoRoomState } from "./reloadContentIntoRoomState/index.js";
import { dispatchMinigameAction, setRoomStateFatalError } from "./roomState/index.js";
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

const { broadcaster } = attachSocketServer(httpServer);

// RECREATE's forger: the one thing the server does that is not a reply to a
// host tap. With no key in the environment or the pack's .env the runner still
// attaches and fails every attempt straight away with a reason the host can
// read out — the game degrades to judging by ear, it never stalls.
const geminiApiKey = resolveGeminiApiKey({ contentRootDir, env: process.env });
const imageEditor = geminiApiKey === null ? null : createGeminiImageEditor({ apiKey: geminiApiKey });
const recreateGenerationRunner = createRecreateGenerationRunner({
  generateAttempt:
    imageEditor === null ? null : resolveRecreateAttemptGenerator({ contentRootDir, imageEditor }),
  applyResult: (result) => {
    broadcaster.applyAndBroadcast(() =>
      dispatchMinigameAction("RECREATE", "resolveGeneration", result)
    );
  },
  onError: (attemptId, error) => {
    logError(`server:recreateGenerationFailed ${attemptId}`, error);
  }
});
broadcaster.onBroadcast((roomState) => {
  recreateGenerationRunner.reconcile(roomState);
});
logInfo("server:recreateGenerator", {
  enabled: imageEditor !== null,
  model: imageEditor?.model ?? null
});

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
