import type {
  MinigameDevManifest,
  MinigameRendererBundle,
  MinigameRuntimePlugin
} from "@wingnight/minigames-core";
import { drawingRendererBundle } from "@wingnight/minigames-drawing/client";
import { drawingDevManifest } from "@wingnight/minigames-drawing/dev";
import { drawingRuntimePlugin } from "@wingnight/minigames-drawing/runtime";
import { emojiCharadesRendererBundle } from "@wingnight/minigames-emoji-charades/client";
import { emojiCharadesDevManifest } from "@wingnight/minigames-emoji-charades/dev";
import { emojiCharadesRuntimePlugin } from "@wingnight/minigames-emoji-charades/runtime";
import { fappyRendererBundle } from "@wingnight/minigames-fappy/client";
import { fappyDevManifest } from "@wingnight/minigames-fappy/dev";
import { fappyRuntimePlugin } from "@wingnight/minigames-fappy/runtime";
import { geoRendererBundle } from "@wingnight/minigames-geo/client";
import { geoDevManifest } from "@wingnight/minigames-geo/dev";
import { geoRuntimePlugin } from "@wingnight/minigames-geo/runtime";
import { joustRendererBundle } from "@wingnight/minigames-joust/client";
import { joustDevManifest } from "@wingnight/minigames-joust/dev";
import { joustRuntimePlugin } from "@wingnight/minigames-joust/runtime";
import { recreateRendererBundle } from "@wingnight/minigames-recreate/client";
import { recreateDevManifest } from "@wingnight/minigames-recreate/dev";
import { recreateRuntimePlugin } from "@wingnight/minigames-recreate/runtime";
import { songGuessRendererBundle } from "@wingnight/minigames-song-guess/client";
import { songGuessDevManifest } from "@wingnight/minigames-song-guess/dev";
import { songGuessRuntimePlugin } from "@wingnight/minigames-song-guess/runtime";
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
  SONG_GUESS: {
    rendererBundle: songGuessRendererBundle,
    devManifest: songGuessDevManifest,
    runtimePlugin: songGuessRuntimePlugin
  },
  JOUST: {
    rendererBundle: joustRendererBundle,
    devManifest: joustDevManifest,
    runtimePlugin: joustRuntimePlugin
  },
  FAPPY: {
    rendererBundle: fappyRendererBundle,
    devManifest: fappyDevManifest,
    runtimePlugin: fappyRuntimePlugin
  },
  RECREATE: {
    rendererBundle: recreateRendererBundle,
    devManifest: recreateDevManifest,
    runtimePlugin: recreateRuntimePlugin
  },
  DRAWING: {
    rendererBundle: drawingRendererBundle,
    devManifest: drawingDevManifest,
    runtimePlugin: drawingRuntimePlugin
  },
  EMOJI_CHARADES: {
    rendererBundle: emojiCharadesRendererBundle,
    devManifest: emojiCharadesDevManifest,
    runtimePlugin: emojiCharadesRuntimePlugin
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
