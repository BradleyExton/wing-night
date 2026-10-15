import type { MinigameRendererBundle } from "@wingnight/minigames-core";
import { brawlRendererBundle } from "@wingnight/minigames-brawl/client";
import { drawingRendererBundle } from "@wingnight/minigames-drawing/client";
import { emojiCharadesRendererBundle } from "@wingnight/minigames-emoji-charades/client";
import { fappyRendererBundle } from "@wingnight/minigames-fappy/client";
import { geoRendererBundle } from "@wingnight/minigames-geo/client";
import { joustRendererBundle } from "@wingnight/minigames-joust/client";
import { mountRendererBundle } from "@wingnight/minigames-mount/client";
import { recreateRendererBundle } from "@wingnight/minigames-recreate/client";
import { schlonicRendererBundle } from "@wingnight/minigames-schlonic/client";
import { songGuessRendererBundle } from "@wingnight/minigames-song-guess/client";
import { triviaRendererBundle } from "@wingnight/minigames-trivia/client";
import type { MinigameType } from "@wingnight/shared";

// The party half of the registry: the surfaces the tablet, the TV and the
// phones draw. The dev manifests and runtime plugins live in ../devRegistry,
// which only the dev sandbox reaches — a party never downloads the server's
// reducers.
//
// Keyed by MinigameType so adding a new game to MINIGAME_DEFINITIONS fails to
// compile until its renderer bundle is registered.
const MINIGAME_RENDERER_REGISTRY: Record<MinigameType, MinigameRendererBundle> = {
  TRIVIA: triviaRendererBundle,
  GEO: geoRendererBundle,
  SONG_GUESS: songGuessRendererBundle,
  JOUST: joustRendererBundle,
  FAPPY: fappyRendererBundle,
  RECREATE: recreateRendererBundle,
  SCHLONIC: schlonicRendererBundle,
  BRAWL: brawlRendererBundle,
  MOUNT: mountRendererBundle,
  DRAWING: drawingRendererBundle,
  EMOJI_CHARADES: emojiCharadesRendererBundle
};

export const resolveMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return MINIGAME_RENDERER_REGISTRY[minigameType] ?? null;
};
