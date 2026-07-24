import { drawingRuntimePlugin } from "@wingnight/minigames-drawing/runtime";
import { geoRuntimePlugin } from "@wingnight/minigames-geo/runtime";
import { triviaRuntimePlugin } from "@wingnight/minigames-trivia/runtime";
import type { MinigameType } from "@wingnight/shared";
import type { MinigameRuntimePlugin } from "@wingnight/minigames-core";

// Keyed by MinigameType so adding a new game to MINIGAME_DEFINITIONS fails to
// compile until its runtime plugin is registered here.
const runtimePluginByMinigameType: Record<MinigameType, MinigameRuntimePlugin> = {
  TRIVIA: triviaRuntimePlugin,
  GEO: geoRuntimePlugin,
  DRAWING: drawingRuntimePlugin
};

export const resolveMinigameRuntimePlugin = (
  minigameType: MinigameType
): MinigameRuntimePlugin => {
  return runtimePluginByMinigameType[minigameType];
};
