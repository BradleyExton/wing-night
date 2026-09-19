import type { MinigameRendererBundle } from "@wingnight/minigames-core";
import { drawingRendererBundle } from "@wingnight/minigames-drawing/client";
import { emojiCharadesRendererBundle } from "@wingnight/minigames-emoji-charades/client";
import { fappyRendererBundle } from "@wingnight/minigames-fappy/client";
import { geoRendererBundle } from "@wingnight/minigames-geo/client";
import { joustRendererBundle } from "@wingnight/minigames-joust/client";
import { recreateRendererBundle } from "@wingnight/minigames-recreate/client";
import { songGuessRendererBundle } from "@wingnight/minigames-song-guess/client";
import { triviaRendererBundle } from "@wingnight/minigames-trivia/client";
import type { MinigameType } from "@wingnight/shared";

// The party half of the registry: the surfaces the tablet and the TV draw.
// The dev manifests and runtime plugins live in ../devRegistry, which only the
// sandbox reaches and only through a dynamic import — a party never downloads
// the server's reducers.
//
// Keyed by MinigameType so adding a new game to MINIGAME_DEFINITIONS fails to
// compile until its renderer bundle is registered.
const MINIGAME_RENDERER_BUNDLES: Record<MinigameType, MinigameRendererBundle> = {
  TRIVIA: triviaRendererBundle,
  GEO: geoRendererBundle,
  SONG_GUESS: songGuessRendererBundle,
  JOUST: joustRendererBundle,
  FAPPY: fappyRendererBundle,
  RECREATE: recreateRendererBundle,
  DRAWING: drawingRendererBundle,
  EMOJI_CHARADES: emojiCharadesRendererBundle
};

export const resolveMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return MINIGAME_RENDERER_BUNDLES[minigameType] ?? null;
};
