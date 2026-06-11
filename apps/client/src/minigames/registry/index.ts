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
import {
  resolveMinigameTypeFromSlug as resolveSharedMinigameTypeFromSlug,
  type MinigameType
} from "@wingnight/shared";

const minigameRendererByType: Record<MinigameType, MinigameRendererBundle> = {
  TRIVIA: triviaRendererBundle,
  GEO: geoRendererBundle,
  DRAWING: drawingRendererBundle
};

const minigameDevManifestByType: Record<MinigameType, MinigameDevManifest> = {
  TRIVIA: triviaDevManifest,
  GEO: geoDevManifest,
  DRAWING: drawingDevManifest
};

const minigameRuntimePluginByType: Record<MinigameType, MinigameRuntimePlugin> = {
  TRIVIA: triviaRuntimePlugin,
  GEO: geoRuntimePlugin,
  DRAWING: drawingRuntimePlugin
};

export const resolveMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return minigameRendererByType[minigameType] ?? null;
};

export const resolveMinigameDevManifest = (
  minigameType: MinigameType
): MinigameDevManifest | null => {
  return minigameDevManifestByType[minigameType] ?? null;
};

export const resolveMinigameRuntimePlugin = (
  minigameType: MinigameType
): MinigameRuntimePlugin | null => {
  return minigameRuntimePluginByType[minigameType] ?? null;
};

export const resolveMinigameTypeFromSlug = (
  slug: string
): MinigameType | null => {
  return resolveSharedMinigameTypeFromSlug(slug);
};
