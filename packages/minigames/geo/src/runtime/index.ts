import {
  createUnsupportedMinigameRuntimePlugin
} from "@wingnight/minigames-core";
import { geoMinigameId, geoMinigameMetadata } from "../metadata.js";

const DEFAULT_UNSUPPORTED_MESSAGE = "GEO gameplay runtime is not implemented yet.";

export { geoMinigameId, geoMinigameMetadata };

export const geoRuntimePlugin = createUnsupportedMinigameRuntimePlugin({
  minigameId: geoMinigameId,
  metadata: geoMinigameMetadata,
  unsupportedMessage: DEFAULT_UNSUPPORTED_MESSAGE
});
