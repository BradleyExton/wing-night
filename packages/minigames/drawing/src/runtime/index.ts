import {
  MINIGAME_API_VERSION,
  type MinigameType
} from "@wingnight/shared";
import type { MinigamePluginMetadata } from "@wingnight/minigames-core";

export const drawingMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

export const drawingMinigameId: MinigameType = "DRAWING";
