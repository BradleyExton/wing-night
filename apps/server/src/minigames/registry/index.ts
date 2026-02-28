import { drawingRuntimePlugin } from "@wingnight/minigames-drawing/runtime";
import { geoRuntimePlugin } from "@wingnight/minigames-geo/runtime";
import { triviaRuntimePlugin } from "@wingnight/minigames-trivia/runtime";
import type { MinigameType } from "@wingnight/shared";
import { MINIGAME_API_VERSION } from "@wingnight/shared";
import type {
  MinigamePluginMetadata,
  MinigameRuntimePlugin
} from "@wingnight/minigames-core";

export type ResolvedMinigameRuntimePlugin = MinigameRuntimePlugin;
export type ResolvedMinigameDescriptor = {
  runtimePlugin: ResolvedMinigameRuntimePlugin;
  metadata: MinigamePluginMetadata;
};

const runtimePluginByMinigameType: Record<MinigameType, MinigameRuntimePlugin> = {
  TRIVIA: triviaRuntimePlugin,
  GEO: geoRuntimePlugin,
  DRAWING: drawingRuntimePlugin
};

export const resolveMinigameRuntimePlugin = (
  minigameType: MinigameType
): ResolvedMinigameRuntimePlugin => {
  return runtimePluginByMinigameType[minigameType];
};

export const resolveMinigameDescriptor = (
  minigameType: MinigameType
): ResolvedMinigameDescriptor => {
  const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);
  const metadata = runtimePlugin.metadata ?? {
    minigameApiVersion: MINIGAME_API_VERSION,
    capabilities: {
      supportsHostRenderer: true,
      supportsDisplayRenderer: true,
      supportsDevScenarios: true
    },
    intro: {
      displayName: minigameType,
      shortTagline: `${minigameType} metadata fallback.`,
      objective: "Metadata fallback should not be shown in normal runtime usage.",
      howToPlay: ["Metadata fallback should not be shown in normal runtime usage."],
      winCondition: "Metadata fallback should not be shown in normal runtime usage.",
      quickTip: "Metadata fallback should not be shown in normal runtime usage.",
      iconKey: minigameType.toLowerCase()
    }
  };

  return {
    runtimePlugin,
    metadata
  };
};
