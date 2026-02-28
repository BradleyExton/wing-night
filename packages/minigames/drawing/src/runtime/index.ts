import {
  createUnsupportedMinigameRuntimePlugin
} from "@wingnight/minigames-core";
import { drawingMinigameId, drawingMinigameMetadata } from "../metadata.js";

const DEFAULT_UNSUPPORTED_MESSAGE = "DRAWING gameplay runtime is not implemented yet.";

export { drawingMinigameId, drawingMinigameMetadata };

export const drawingRuntimePlugin = createUnsupportedMinigameRuntimePlugin({
  minigameId: drawingMinigameId,
  metadata: drawingMinigameMetadata,
  unsupportedMessage: DEFAULT_UNSUPPORTED_MESSAGE
});
