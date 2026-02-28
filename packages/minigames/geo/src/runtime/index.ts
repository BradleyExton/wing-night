import {
  createUnsupportedMinigameRuntimePlugin,
  type MinigamePluginMetadata
} from "@wingnight/minigames-core";
import { MINIGAME_API_VERSION, type MinigameType } from "@wingnight/shared";

const DEFAULT_UNSUPPORTED_MESSAGE = "GEO gameplay runtime is not implemented yet.";

export const geoMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

export const geoMinigameId: MinigameType = "GEO";

export const geoRuntimePlugin = createUnsupportedMinigameRuntimePlugin({
  minigameId: geoMinigameId,
  metadata: geoMinigameMetadata,
  unsupportedMessage: DEFAULT_UNSUPPORTED_MESSAGE
});
