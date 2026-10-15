import type {
  MinigameDevAction,
  MinigameDevManifest,
  MinigameRuntimePlugin
} from "@wingnight/minigames-core";
import { brawlDevManifest } from "@wingnight/minigames-brawl/dev";
import { brawlRuntimePlugin } from "@wingnight/minigames-brawl/runtime";
import { drawingDevManifest } from "@wingnight/minigames-drawing/dev";
import { drawingRuntimePlugin } from "@wingnight/minigames-drawing/runtime";
import { emojiCharadesDevManifest } from "@wingnight/minigames-emoji-charades/dev";
import { emojiCharadesRuntimePlugin } from "@wingnight/minigames-emoji-charades/runtime";
import { fappyDevManifest } from "@wingnight/minigames-fappy/dev";
import { fappyRuntimePlugin } from "@wingnight/minigames-fappy/runtime";
import { geoDevManifest } from "@wingnight/minigames-geo/dev";
import { geoRuntimePlugin } from "@wingnight/minigames-geo/runtime";
import { joustDevManifest } from "@wingnight/minigames-joust/dev";
import { joustRuntimePlugin } from "@wingnight/minigames-joust/runtime";
import { mountDevActions, mountDevManifest } from "@wingnight/minigames-mount/dev";
import { mountRuntimePlugin } from "@wingnight/minigames-mount/runtime";
import { recreateDevManifest } from "@wingnight/minigames-recreate/dev";
import { recreateRuntimePlugin } from "@wingnight/minigames-recreate/runtime";
import { schlonicDevManifest } from "@wingnight/minigames-schlonic/dev";
import { schlonicRuntimePlugin } from "@wingnight/minigames-schlonic/runtime";
import { songGuessDevManifest } from "@wingnight/minigames-song-guess/dev";
import { songGuessRuntimePlugin } from "@wingnight/minigames-song-guess/runtime";
import { triviaDevManifest } from "@wingnight/minigames-trivia/dev";
import { triviaRuntimePlugin } from "@wingnight/minigames-trivia/runtime";
import type { MinigameType } from "@wingnight/shared";

// The sandbox half of the registry. Runtime plugins are the SERVER's reducers —
// JOUST's physics, BRAWL's and MOUNT's sims — and the client wants them for one
// reason: /dev/minigame drives the real runtime with no server behind it.
// Nothing on a party surface may import this. Its only importer is
// MinigameDevSandbox, which RouteContent reaches through a lazy `import()` — so
// this module and every plugin it pulls land in the sandbox route's chunk, and
// the TV, the tablet and the phones never download them.
type MinigameDevRegistration = {
  devManifest: MinigameDevManifest;
  runtimePlugin: MinigameRuntimePlugin;
  // Scripted moves only the dev sandbox offers, as buttons (`MinigameDevAction`).
  devActions?: readonly MinigameDevAction[];
};

// Keyed by MinigameType so adding a new game to MINIGAME_DEFINITIONS fails to
// compile until its dev manifest and runtime plugin are registered.
const MINIGAME_DEV_REGISTRY: Record<MinigameType, MinigameDevRegistration> = {
  TRIVIA: {
    devManifest: triviaDevManifest,
    runtimePlugin: triviaRuntimePlugin
  },
  GEO: {
    devManifest: geoDevManifest,
    runtimePlugin: geoRuntimePlugin
  },
  SONG_GUESS: {
    devManifest: songGuessDevManifest,
    runtimePlugin: songGuessRuntimePlugin
  },
  JOUST: {
    devManifest: joustDevManifest,
    runtimePlugin: joustRuntimePlugin
  },
  FAPPY: {
    devManifest: fappyDevManifest,
    runtimePlugin: fappyRuntimePlugin
  },
  RECREATE: {
    devManifest: recreateDevManifest,
    runtimePlugin: recreateRuntimePlugin
  },
  SCHLONIC: {
    devManifest: schlonicDevManifest,
    runtimePlugin: schlonicRuntimePlugin
  },
  BRAWL: {
    devManifest: brawlDevManifest,
    runtimePlugin: brawlRuntimePlugin
  },
  MOUNT: {
    devManifest: mountDevManifest,
    runtimePlugin: mountRuntimePlugin,
    devActions: mountDevActions
  },
  DRAWING: {
    devManifest: drawingDevManifest,
    runtimePlugin: drawingRuntimePlugin
  },
  EMOJI_CHARADES: {
    devManifest: emojiCharadesDevManifest,
    runtimePlugin: emojiCharadesRuntimePlugin
  }
};

export const resolveMinigameDevManifest = (
  minigameType: MinigameType
): MinigameDevManifest | null => {
  return MINIGAME_DEV_REGISTRY[minigameType]?.devManifest ?? null;
};

export const resolveMinigameRuntimePlugin = (
  minigameType: MinigameType
): MinigameRuntimePlugin | null => {
  return MINIGAME_DEV_REGISTRY[minigameType]?.runtimePlugin ?? null;
};

export const resolveMinigameDevActions = (
  minigameType: MinigameType
): readonly MinigameDevAction[] => {
  return MINIGAME_DEV_REGISTRY[minigameType]?.devActions ?? [];
};
