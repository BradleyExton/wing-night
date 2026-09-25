export const MINIGAME_API_VERSION = 1 as const;
export type MinigameApiVersion = typeof MINIGAME_API_VERSION;

export type MinigameContractMetadataDefaults = {
  minigameApiVersion: number;
  capabilityFlags: readonly string[];
};

export type MinigameDefinition = {
  id: string;
  slug: string;
  // The game's one guest-facing name: the host rail, the host briefing headline, the lobby card,
  // the TV's "playing" line and the marquee's neon sign all read this field and nothing else.
  // Never print the enum key — `EMOJI_CHARADES` is an identifier, not a title.
  displayName: string;
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
    displayName: "Trivia",
    // Host-paced: the turn ends when the team has spent its questions, not
    // when a clock runs out. A room clock only ever lied here — the host reads
    // each question aloud and waits on the table, so `triviaSeconds` expired
    // mid-turn while the verdict buttons stayed live, and a turn that ran out
    // of questions first went on wearing a countdown nobody was racing.
    timerKey: null,
    rulesKey: "trivia",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: ["recordAttempt"]
    }
  },
  GEO: {
    id: "GEO",
    slug: "geo",
    displayName: "Geo",
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
    displayName: "Who's That Song",
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
    displayName: "Slingshlong",
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
    displayName: "Fappy Bird",
    // Host-paced: the turn ends when the team has flown its legs, not when a
    // clock runs out.
    timerKey: null,
    rulesKey: "fappy",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: ["flap", "endLeg", "timeOut", "skipLeg", "resetTurn"]
    }
  },
  SCHLONIC: {
    id: "SCHLONIC",
    slug: "schlonic",
    displayName: "Schlonic",
    // Host-paced: the turn ends when the team has run the zone, not when a clock runs out. The
    // run has its own clock, and it is the zone's, not the room's.
    timerKey: null,
    rulesKey: "schlonic",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: ["press", "release", "endRun", "skipRun", "resetTurn"]
    }
  },
  DRAWING: {
    id: "DRAWING",
    slug: "drawing",
    displayName: "Drawing",
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
  RECREATE: {
    id: "RECREATE",
    slug: "recreate",
    displayName: "Forgery Studio",
    // Host-paced: a target ends when the host locks its score, not when a
    // clock runs out. The tablet is in the team's hands while they write.
    timerKey: null,
    rulesKey: "recreate",
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: [
        "submitPrompt",
        "resolveGeneration",
        "toggleIngredient",
        "lockScore",
        "retryPrompt",
        "nextTarget"
      ]
    }
  },
  EMOJI_CHARADES: {
    id: "EMOJI_CHARADES",
    slug: "emoji-charades",
    displayName: "Emoji Charades",
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
