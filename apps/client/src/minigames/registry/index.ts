import type {
  MinigameDevManifest,
  MinigameRendererBundle,
  MinigameRuntimePlugin
} from "@wingnight/minigames-core";
import { drawingRendererBundle } from "@wingnight/minigames-drawing/client";
import { drawingDevManifest } from "@wingnight/minigames-drawing/dev";
import { drawingRuntimePlugin } from "@wingnight/minigames-drawing/runtime";
import { geoRendererBundle } from "@wingnight/minigames-geo/client";
import { geoDevManifest } from "@wingnight/minigames-geo/dev";
import { geoRuntimePlugin } from "@wingnight/minigames-geo/runtime";
import { triviaRendererBundle } from "@wingnight/minigames-trivia/client";
import { triviaDevManifest } from "@wingnight/minigames-trivia/dev";
import { triviaRuntimePlugin } from "@wingnight/minigames-trivia/runtime";
import type { MinigameType } from "@wingnight/shared";

type MinigameRegistration = {
  rendererBundle: MinigameRendererBundle;
  devManifest: MinigameDevManifest;
  runtimePlugin: MinigameRuntimePlugin;
};

// Keyed by MinigameType so adding a new game to MINIGAME_DEFINITIONS fails to
// compile until its bundle, dev manifest, and runtime plugin are registered.
const MINIGAME_REGISTRY: Record<MinigameType, MinigameRegistration> = {
  TRIVIA: {
    rendererBundle: triviaRendererBundle,
    devManifest: triviaDevManifest,
    runtimePlugin: triviaRuntimePlugin
  },
  GEO: {
    rendererBundle: geoRendererBundle,
    devManifest: geoDevManifest,
    runtimePlugin: geoRuntimePlugin
  },
  DRAWING: {
    rendererBundle: drawingRendererBundle,
    devManifest: drawingDevManifest,
    runtimePlugin: drawingRuntimePlugin
  }
};

export const resolveMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return MINIGAME_REGISTRY[minigameType]?.rendererBundle ?? null;
};

export const resolveMinigameDevManifest = (
  minigameType: MinigameType
): MinigameDevManifest | null => {
  return MINIGAME_REGISTRY[minigameType]?.devManifest ?? null;
};

export const resolveMinigameRuntimePlugin = (
  minigameType: MinigameType
): MinigameRuntimePlugin | null => {
  return MINIGAME_REGISTRY[minigameType]?.runtimePlugin ?? null;
};
