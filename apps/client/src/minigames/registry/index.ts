import type { MinigameRendererBundle } from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import {
  createMinigameRendererBundleStore,
  type MinigameRendererLoad
} from "../rendererBundleStore";

// The party half of the registry: the surfaces the tablet, the TV and the
// phones draw. The dev manifests and runtime plugins live in ../devRegistry,
// which only the dev sandbox reaches — a party never downloads the server's
// reducers.
//
// Each renderer is behind its own `import()` for the same reason: a night plays
// one game at a time, and every game in one chunk means the TV downloads ten
// surfaces it will never draw. Rollup gives every dynamic import its own chunk,
// so this file is the whole split — as long as nothing on a party route imports
// a `@wingnight/minigames-*/client` entry statically, which would hoist it back.
// (The teaser is its own build and imports its four games directly; that is
// fine, because it plays all four from its landing page.)
//
// Keyed by MinigameType so adding a new game to MINIGAME_DEFINITIONS fails to
// compile until its renderer bundle is registered.
type MinigameRendererRegistration = {
  loadBundle: () => Promise<MinigameRendererBundle>;
  // Declares that the display surface is the room's speaker for this game, so
  // the display shell knows to offer its tap-to-enable-audio overlay even when
  // the active team has no anthem to play.
  //
  // It lives HERE, next to the loader, rather than inside the bundle: the shell
  // decides whether to show the overlay at MINIGAME_INTRO, before anything
  // renders the surface, and reading a field off the bundle would mean
  // downloading the renderer to learn one boolean. Static metadata about a game
  // belongs on the near side of the import boundary.
  requiresDisplayAudio?: boolean;
};

const MINIGAME_RENDERER_REGISTRY: Record<MinigameType, MinigameRendererRegistration> = {
  TRIVIA: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-trivia/client")).triviaRendererBundle
  },
  GEO: {
    loadBundle: async () => (await import("@wingnight/minigames-geo/client")).geoRendererBundle
  },
  SONG_GUESS: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-song-guess/client")).songGuessRendererBundle,
    // The TV is the speaker for this round: the clip plays from the display.
    requiresDisplayAudio: true
  },
  JOUST: {
    loadBundle: async () => (await import("@wingnight/minigames-joust/client")).joustRendererBundle
  },
  FAPPY: {
    loadBundle: async () => (await import("@wingnight/minigames-fappy/client")).fappyRendererBundle
  },
  RECREATE: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-recreate/client")).recreateRendererBundle
  },
  SCHLONIC: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-schlonic/client")).schlonicRendererBundle,
    // The TV is the speaker for the run's soundboard (`audio/`).
    requiresDisplayAudio: true
  },
  BRAWL: {
    loadBundle: async () => (await import("@wingnight/minigames-brawl/client")).brawlRendererBundle,
    // The TV is the speaker for the street's soundboard (spec §0.10).
    requiresDisplayAudio: true
  },
  MOUNT: {
    loadBundle: async () => (await import("@wingnight/minigames-mount/client")).mountRendererBundle,
    // The TV is the speaker for the climb's soundboard (spec §0.7).
    requiresDisplayAudio: true
  },
  DRAWING: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-drawing/client")).drawingRendererBundle
  },
  EMOJI_CHARADES: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-emoji-charades/client")).emojiCharadesRendererBundle
  }
};

// Resolved bundles are kept forever by the store below: a renderer is a module,
// the import cache already holds it, and remembering it here is what lets a
// surface render the real component on its FIRST pass instead of suspending for
// a tick. That distinction is the whole point of the prefetch — see
// useMinigameRendererBundle. The store also owns what happens when a chunk does
// NOT arrive; that policy lives in ../rendererBundleStore.
const minigameRendererBundleStore = createMinigameRendererBundleStore({
  loadRendererBundle: (minigameType) => MINIGAME_RENDERER_REGISTRY[minigameType].loadBundle()
});

// Synchronous, and deliberately so. Null means "the chunk has not landed yet",
// never "there is no such game" — the Record above is exhaustive.
export const peekMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return minigameRendererBundleStore.peekBundle(minigameType);
};

// The same read, with the reason the bundle is missing attached: still on the
// wire, or failed often enough that the surface should stop drawing nothing and
// say so.
export const peekMinigameRendererLoad = (minigameType: MinigameType): MinigameRendererLoad => {
  return minigameRendererBundleStore.peekLoad(minigameType);
};

// Fires whenever any renderer's load state changes — a chunk landing, or a run
// of failures crossing into "unavailable".
export const subscribeToMinigameRendererLoads = (listener: () => void): (() => void) => {
  return minigameRendererBundleStore.subscribe(listener);
};

// Idempotent: the second caller joins the first one's import rather than
// starting a second fetch, and a failed load retries itself rather than
// latching. Resolves null when the current attempt failed — the retry that
// follows publishes to subscribers, not to this promise.
export const loadMinigameRendererBundle = (
  minigameType: MinigameType
): Promise<MinigameRendererBundle | null> => {
  return minigameRendererBundleStore.requestBundle(minigameType);
};

export const minigameRequiresDisplayAudio = (minigameType: MinigameType): boolean => {
  return MINIGAME_RENDERER_REGISTRY[minigameType]?.requiresDisplayAudio ?? false;
};
