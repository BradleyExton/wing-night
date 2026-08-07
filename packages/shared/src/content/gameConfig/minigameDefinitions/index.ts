export const MINIGAME_API_VERSION = 1 as const;
export type MinigameApiVersion = typeof MINIGAME_API_VERSION;

export type MinigameContractMetadataDefaults = {
  minigameApiVersion: number;
  capabilityFlags: readonly string[];
};

export type MinigameDefinition = {
  id: string;
  slug: string;
  timerKey: string;
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
  }
} as const satisfies Record<string, MinigameDefinition>;

export type MinigameType = keyof typeof MINIGAME_DEFINITIONS;

export type MinigameTimerKey =
  (typeof MINIGAME_DEFINITIONS)[MinigameType]["timerKey"];

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
