export const MINIGAME_API_VERSION = 1 as const;
export type MinigameApiVersion = typeof MINIGAME_API_VERSION;

export type MinigameContractMetadataDefaults = {
  minigameApiVersion: number;
  capabilityFlags: readonly string[];
};

export type MinigameDefinition = {
  id: string;
  slug: string;
  // `null` for host-paced games, which end on a host action rather than a
  // clock and so own no field in `GameConfigTimers`.
  timerKey: string | null;
  rulesKey: string | null;
  contractMetadata: MinigameContractMetadataDefaults;
};

// Single registration point for shared contracts: adding a game here brings
// its slug, timer key, and optional rules key into every derived type below.
export const MINIGAME_DEFINITIONS = {
  TRIVIA: {
    id: "TRIVIA",
    slug: "trivia",
    timerKey: "triviaSeconds",
    rulesKey: "trivia",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: ["recordAttempt"]
    }
  },
  GEO: {
    id: "GEO",
    slug: "geo",
    timerKey: "geoSeconds",
    rulesKey: "geo",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: ["setGuess", "submitGuess", "nextPrompt"]
    }
  },
  SONG_GUESS: {
    id: "SONG_GUESS",
    slug: "song-guess",
    // Host-paced: the turn ends when the host has worked through the songs,
    // not when a clock runs out.
    timerKey: null,
    rulesKey: "songGuess",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: [
        "playClip",
        "pauseClip",
        "replayClip",
        "triggerReveal",
        "markTitle",
        "markArtist",
        "nextSong",
        "skipSong"
      ]
    }
  },
  JOUST: {
    id: "JOUST",
    slug: "joust",
    // Host-paced: the turn ends when the team has used its shots, not when a
    // clock runs out.
    timerKey: null,
    rulesKey: "joust",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: ["setAim", "launch", "nextShot", "skipShot", "resetTurn"]
    }
  },
  FAPPY: {
    id: "FAPPY",
    slug: "fappy",
    // Host-paced: the turn ends when the team has flown its legs, not when a
    // clock runs out.
    timerKey: null,
    rulesKey: "fappy",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: ["flap", "endLeg", "nextLeg", "skipLeg", "redoLeg", "resetTurn"]
    }
  },
  DRAWING: {
    id: "DRAWING",
    slug: "drawing",
    timerKey: "drawingSeconds",
    rulesKey: null,
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: [
        "beginStroke",
        "appendStrokePoints",
        "endStroke",
        "undoStroke",
        "clearCanvas",
        "markCorrect",
        "markIncorrect",
        "skipPrompt"
      ]
    }
  },
  EMOJI_CHARADES: {
    id: "EMOJI_CHARADES",
    slug: "emoji-charades",
    timerKey: "emojiCharadesSeconds",
    rulesKey: "emojiCharades",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: [
        "selectDeck",
        "appendEmoji",
        "removeEmoji",
        "clearEmojis",
        "markCorrect",
        "skipSubject"
      ]
    }
  }
} as const satisfies Record<string, MinigameDefinition>;

export type MinigameType = keyof typeof MINIGAME_DEFINITIONS;

// Host-paced games contribute `null`, which is not a timers field — excluding
// it keeps `GameConfigTimers` exactly the set of keys a config must carry.
export type MinigameTimerKey = Exclude<
  (typeof MINIGAME_DEFINITIONS)[MinigameType]["timerKey"],
  null
>;

export type MinigameRulesKey = NonNullable<
  (typeof MINIGAME_DEFINITIONS)[MinigameType]["rulesKey"]
>;

export const MINIGAME_TYPES = Object.freeze(
  Object.keys(MINIGAME_DEFINITIONS) as MinigameType[]
);

export const MINIGAME_TYPE_BY_SLUG: Readonly<Record<string, MinigameType>> =
  Object.freeze(
    MINIGAME_TYPES.reduce<Record<string, MinigameType>>((slugMap, minigameType) => {
      slugMap[MINIGAME_DEFINITIONS[minigameType].slug] = minigameType;
      return slugMap;
    }, {})
  );

export const resolveMinigameTypeFromSlug = (
  slug: string
): MinigameType | null => {
  const normalizedSlug = slug.trim().toLowerCase();

  if (normalizedSlug.length === 0) {
    return null;
  }

  return MINIGAME_TYPE_BY_SLUG[normalizedSlug] ?? null;
};

export const resolveMinigameDefinition = (
  minigameType: MinigameType
): (typeof MINIGAME_DEFINITIONS)[MinigameType] => {
  return MINIGAME_DEFINITIONS[minigameType];
};
