import {
  createUnsupportedMinigameRuntimePlugin,
  type MinigamePluginMetadata
} from "@wingnight/minigames-core";
import { MINIGAME_API_VERSION, type MinigameType } from "@wingnight/shared";

const DEFAULT_UNSUPPORTED_MESSAGE = "DRAWING gameplay runtime is not implemented yet.";

export const drawingMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

export const drawingMinigameId: MinigameType = "DRAWING";

export const drawingRuntimePlugin = createUnsupportedMinigameRuntimePlugin({
  minigameId: drawingMinigameId,
  metadata: drawingMinigameMetadata,
  unsupportedMessage: DEFAULT_UNSUPPORTED_MESSAGE
});
