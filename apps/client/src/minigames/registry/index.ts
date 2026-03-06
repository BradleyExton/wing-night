import type {
  MinigameDevManifest,
  MinigameRendererBundle
} from "@wingnight/minigames-core";
import { drawingRendererBundle } from "@wingnight/minigames-drawing/client";
import { drawingDevManifest } from "@wingnight/minigames-drawing/dev";
import { geoRendererBundle } from "@wingnight/minigames-geo/client";
import { geoDevManifest } from "@wingnight/minigames-geo/dev";
import { triviaRendererBundle } from "@wingnight/minigames-trivia/client";
import { triviaDevManifest } from "@wingnight/minigames-trivia/dev";
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

export const resolveMinigameTypeFromSlug = (
  slug: string
): MinigameType | null => {
  return resolveSharedMinigameTypeFromSlug(slug);
};
