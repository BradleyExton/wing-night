export const MINIGAME_API_VERSION = 1 as const;
export type MinigameApiVersion = typeof MINIGAME_API_VERSION;

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
    rulesKey: "trivia"
  },
  GEO: {
    id: "GEO",
    slug: "geo",
    displayName: "Geo",
    timerKey: "geoSeconds",
    rulesKey: "geo"
  },
  SONG_GUESS: {
    id: "SONG_GUESS",
    slug: "song-guess",
    displayName: "Name That Cheese",
    // Host-paced: the turn ends when the host has worked through the songs,
    // not when a clock runs out.
    timerKey: null,
    rulesKey: "songGuess"
  },
  JOUST: {
    id: "JOUST",
    slug: "joust",
    displayName: "Slingshlong",
    // Host-paced: the turn ends when the team has used its shots, not when a
    // clock runs out.
    timerKey: null,
    rulesKey: "joust"
  },
  FAPPY: {
    id: "FAPPY",
    slug: "fappy",
    displayName: "Fappy Bird",
    // Host-paced: the turn ends when the team has flown its legs, not when a
    // clock runs out.
    timerKey: null,
    rulesKey: "fappy"
  },
  SCHLONIC: {
    id: "SCHLONIC",
    slug: "schlonic",
    displayName: "Dunlop Dash",
    // Host-paced: the turn ends when the team has run the zone, not when a clock runs out. The
    // run has its own clock, and it is the zone's, not the room's.
    timerKey: null,
    rulesKey: "schlonic"
  },
  BRAWL: {
    id: "BRAWL",
    slug: "brawl",
    displayName: "Streets of Barrie",
    // Host-paced: the turn ends when the team has fought its blocks, not when a clock runs out.
    // A block has its own tick cap, and it is the street's, not the room's.
    timerKey: null,
    rulesKey: "brawl"
  },
  MOUNT: {
    id: "MOUNT",
    slug: "mount",
    displayName: "Mount Your Hens",
    // Host-paced: the turn ends when the team has climbed, one climb each, not when a clock runs
    // out. A climb has its own tick clock, and it is the pile's, not the room's.
    timerKey: null,
    rulesKey: "mount"
  },
  DRAWING: {
    id: "DRAWING",
    slug: "drawing",
    displayName: "Drawing",
    timerKey: "drawingSeconds",
    rulesKey: "drawing"
  },
  RECREATE: {
    id: "RECREATE",
    slug: "recreate",
    displayName: "Forgery Studio",
    // Host-paced: a target ends when the host locks its score, not when a
    // clock runs out. The tablet is in the team's hands while they write.
    timerKey: null,
    rulesKey: "recreate"
  },
  EMOJI_CHARADES: {
    id: "EMOJI_CHARADES",
    slug: "emoji-charades",
    displayName: "Emoji Charades",
    timerKey: "emojiCharadesSeconds",
    rulesKey: "emojiCharades"
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
