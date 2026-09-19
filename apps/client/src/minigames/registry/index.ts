import type { MinigameRendererBundle } from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

// The party half of the registry: the surfaces the tablet and the TV draw.
// The dev manifests and runtime plugins live in ../devRegistry, which only the
// sandbox reaches and only through a dynamic import — a party never downloads
// the server's reducers.
//
// Each renderer is behind its own `import()` for the same reason: a night plays
// one game at a time, and eight games in one chunk means the TV downloads seven
// surfaces it will never draw. Rollup gives every dynamic import its own chunk,
// so this file is the whole split — as long as nothing else imports a
// `@wingnight/minigames-*/client` entry statically, which would hoist it back.
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
  // has to decide whether to show the overlay at MINIGAME_INTRO, which is a
  // phase before anything renders the surface, and reading a field off the
  // bundle would mean downloading the renderer to learn one boolean. Static
  // metadata about a game belongs on the near side of the import boundary.
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
    // The TV is the speaker for this round.
    requiresDisplayAudio: true
  },
  JOUST: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-joust/client")).joustRendererBundle
  },
  FAPPY: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-fappy/client")).fappyRendererBundle
  },
  RECREATE: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-recreate/client")).recreateRendererBundle
  },
  DRAWING: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-drawing/client")).drawingRendererBundle
  },
  EMOJI_CHARADES: {
    loadBundle: async () =>
      (await import("@wingnight/minigames-emoji-charades/client"))
        .emojiCharadesRendererBundle
  }
};

// Resolved bundles, kept forever: a renderer is a module, the import cache
// already holds it, and remembering it here is what lets a surface render the
// real component on its FIRST pass instead of suspending for a tick. That
// distinction is the whole point of the prefetch — see useMinigameRendererBundle.
const warmBundleByMinigameType = new Map<MinigameType, MinigameRendererBundle>();
const inFlightLoadByMinigameType = new Map<
  MinigameType,
  Promise<MinigameRendererBundle | null>
>();

// Synchronous, and deliberately so. Null means "the chunk has not landed yet",
// never "there is no such game" — the Record above is exhaustive.
export const peekMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return warmBundleByMinigameType.get(minigameType) ?? null;
};

// Idempotent: the second caller joins the first one's import rather than
// starting a second fetch.
export const loadMinigameRendererBundle = (
  minigameType: MinigameType
): Promise<MinigameRendererBundle | null> => {
  const warmBundle = warmBundleByMinigameType.get(minigameType);

  if (warmBundle !== undefined) {
    return Promise.resolve(warmBundle);
  }

  const inFlightLoad = inFlightLoadByMinigameType.get(minigameType);

  if (inFlightLoad !== undefined) {
    return inFlightLoad;
  }

  const registration = MINIGAME_RENDERER_REGISTRY[minigameType];

  if (registration === undefined) {
    return Promise.resolve(null);
  }

  const load = registration
    .loadBundle()
    .then((rendererBundle) => {
      warmBundleByMinigameType.set(minigameType, rendererBundle);

      return rendererBundle;
    })
    .catch(() => {
      // A chunk that failed to arrive is worth retrying — the next render or
      // the next prefetch starts a fresh request rather than inheriting a
      // permanently rejected promise.
      inFlightLoadByMinigameType.delete(minigameType);

      return null;
    });

  inFlightLoadByMinigameType.set(minigameType, load);

  return load;
};

export const minigameRequiresDisplayAudio = (minigameType: MinigameType): boolean => {
  return MINIGAME_RENDERER_REGISTRY[minigameType]?.requiresDisplayAudio ?? false;
};
