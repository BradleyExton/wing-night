import { brawlRuntimePlugin } from "@wingnight/minigames-brawl/runtime";
import { drawingRuntimePlugin } from "@wingnight/minigames-drawing/runtime";
import { emojiCharadesRuntimePlugin } from "@wingnight/minigames-emoji-charades/runtime";
import { fappyRuntimePlugin } from "@wingnight/minigames-fappy/runtime";
import { geoRuntimePlugin } from "@wingnight/minigames-geo/runtime";
import { joustRuntimePlugin } from "@wingnight/minigames-joust/runtime";
import { mountRuntimePlugin } from "@wingnight/minigames-mount/runtime";
import { recreateRuntimePlugin } from "@wingnight/minigames-recreate/runtime";
import { schlonicRuntimePlugin } from "@wingnight/minigames-schlonic/runtime";
import { songGuessRuntimePlugin } from "@wingnight/minigames-song-guess/runtime";
import { triviaRuntimePlugin } from "@wingnight/minigames-trivia/runtime";
import { isMinigameType, type MinigameType } from "@wingnight/shared";
import type { MinigameRuntimePlugin } from "@wingnight/minigames-core";

// Keyed by MinigameType so adding a new game to MINIGAME_DEFINITIONS fails to
// compile until its runtime plugin is registered here.
const runtimePluginByMinigameType: Record<MinigameType, MinigameRuntimePlugin> = {
  TRIVIA: triviaRuntimePlugin,
  GEO: geoRuntimePlugin,
  SONG_GUESS: songGuessRuntimePlugin,
  JOUST: joustRuntimePlugin,
  FAPPY: fappyRuntimePlugin,
  RECREATE: recreateRuntimePlugin,
  SCHLONIC: schlonicRuntimePlugin,
  BRAWL: brawlRuntimePlugin,
  MOUNT: mountRuntimePlugin,
  DRAWING: drawingRuntimePlugin,
  EMOJI_CHARADES: emojiCharadesRuntimePlugin
};

export const resolveMinigameRuntimePlugin = (
  minigameType: MinigameType
): MinigameRuntimePlugin => {
  return runtimePluginByMinigameType[minigameType];
};

// The same lookup for a name that came off the wire: null for anything this build does not know,
// so a typo — or a phone's garbage — is a refusal rather than a read of `undefined`.
export const findMinigameRuntimePlugin = (minigameType: unknown): MinigameRuntimePlugin | null => {
  return isMinigameType(minigameType) ? runtimePluginByMinigameType[minigameType] : null;
};
