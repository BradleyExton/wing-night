import type {
  MinigameDevManifest,
  MinigamePluginMetadata,
  MinigameRendererBundle
} from "@wingnight/minigames-core";
import { drawingRendererBundle } from "@wingnight/minigames-drawing/client";
import { drawingDevManifest } from "@wingnight/minigames-drawing/dev";
import { drawingMinigameMetadata } from "@wingnight/minigames-drawing/metadata";
import { geoRendererBundle } from "@wingnight/minigames-geo/client";
import { geoDevManifest } from "@wingnight/minigames-geo/dev";
import { geoMinigameMetadata } from "@wingnight/minigames-geo/metadata";
import { triviaRendererBundle } from "@wingnight/minigames-trivia/client";
import { triviaDevManifest } from "@wingnight/minigames-trivia/dev";
import { triviaMinigameMetadata } from "@wingnight/minigames-trivia/metadata";
import type { MinigameType } from "@wingnight/shared";

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

const minigameMetadataByType: Record<MinigameType, MinigamePluginMetadata> = {
  TRIVIA: triviaMinigameMetadata,
  GEO: geoMinigameMetadata,
  DRAWING: drawingMinigameMetadata
};

const minigameTypeBySlug: Record<string, MinigameType> = {
  trivia: "TRIVIA",
  geo: "GEO",
  drawing: "DRAWING"
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

export const resolveMinigameMetadata = (
  minigameType: MinigameType
): MinigamePluginMetadata | null => {
  return minigameMetadataByType[minigameType] ?? null;
};

export const resolveMinigameTypeFromSlug = (
  slug: string
): MinigameType | null => {
  const normalizedSlug = slug.trim().toLowerCase();

  if (normalizedSlug.length === 0) {
    return null;
  }

  return minigameTypeBySlug[normalizedSlug] ?? null;
};

export const resolveMinigameSlug = (minigameType: MinigameType): string => {
  if (minigameType === "TRIVIA") {
    return "trivia";
  }

  if (minigameType === "GEO") {
    return "geo";
  }

  return "drawing";
};
