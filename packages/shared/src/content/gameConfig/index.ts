const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

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

// Every minigame's timer comes from its definition's timerKey; only the
// eating timer is a fixed, game-independent field.
export type GameConfigTimers = { eatingSeconds: number } & Record<
  MinigameTimerKey,
  number
>;

type MinigameRuleValue =
  | null
  | boolean
  | number
  | string
  | MinigameRuleValue[]
  | { [key: string]: MinigameRuleValue };

export type MinigameRuleRecord = { [key: string]: MinigameRuleValue };

// Per-game rules schemas are owned by each minigame package (validated via
// the runtime plugin's isRules hook at content-load time); shared contracts
// only pin the outer keyed-by-rulesKey shape.
export type MinigameRules = Partial<Record<MinigameRulesKey, MinigameRuleRecord>>;

export type GameConfigRound = {
  round: number;
  label: string;
  sauce: string;
  pointsPerPlayer: number;
  minigame: MinigameType;
};

export type GameConfigScoring = {
  defaultMax: number;
  finalRoundMax: number;
};

export type GameConfigFile = {
  name: string;
  rounds: GameConfigRound[];
  minigameScoring: GameConfigScoring;
  timers: GameConfigTimers;
  minigameRules?: MinigameRules;
  setupPreviewRoundSlots?: number;
};

export const SETUP_PREVIEW_ROUND_SLOTS_MAX = 24;

const isMinigameType = (value: unknown): value is MinigameType => {
  return typeof value === "string" && MINIGAME_TYPES.includes(value as MinigameType);
};

const isGameConfigRound = (value: unknown): value is GameConfigRound => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("round" in value) || !isPositiveInteger(value.round)) {
    return false;
  }

  if (!("label" in value) || !isNonEmptyString(value.label)) {
    return false;
  }

  if (!("sauce" in value) || !isNonEmptyString(value.sauce)) {
    return false;
  }

  if (
    !("pointsPerPlayer" in value) ||
    !isPositiveInteger(value.pointsPerPlayer)
  ) {
    return false;
  }

  if (!("minigame" in value) || !isMinigameType(value.minigame)) {
    return false;
  }

  return true;
};

const hasContiguousRoundNumbers = (rounds: GameConfigRound[]): boolean => {
  return rounds.every((round, index) => round.round === index + 1);
};

const isGameConfigScoring = (value: unknown): value is GameConfigScoring => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("defaultMax" in value) || !isPositiveInteger(value.defaultMax)) {
    return false;
  }

  if (!("finalRoundMax" in value) || !isPositiveInteger(value.finalRoundMax)) {
    return false;
  }

  return true;
};

const REQUIRED_TIMER_KEYS: readonly string[] = [
  "eatingSeconds",
  ...MINIGAME_TYPES.map((minigameType) => MINIGAME_DEFINITIONS[minigameType].timerKey)
];

const isGameConfigTimers = (value: unknown): value is GameConfigTimers => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const timers = value as Record<string, unknown>;

  return REQUIRED_TIMER_KEYS.every((timerKey) =>
    isPositiveInteger(timers[timerKey])
  );
};

// Outer shape only: each configured rules entry must be a plain record. The
// per-game schema is validated by the owning plugin's isRules hook.
const isMinigameRules = (value: unknown): value is MinigameRules => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((rulesEntry) => {
    return (
      rulesEntry === undefined ||
      (typeof rulesEntry === "object" &&
        rulesEntry !== null &&
        !Array.isArray(rulesEntry))
    );
  });
};

const isSetupPreviewRoundSlots = (value: unknown): value is number => {
  return isPositiveInteger(value) && value <= SETUP_PREVIEW_ROUND_SLOTS_MAX;
};

export const isGameConfigFile = (value: unknown): value is GameConfigFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("name" in value) || !isNonEmptyString(value.name)) {
    return false;
  }

  if (!("rounds" in value) || !Array.isArray(value.rounds)) {
    return false;
  }

  const rounds = value.rounds;

  if (rounds.length === 0 || !rounds.every((round) => isGameConfigRound(round))) {
    return false;
  }

  if (!hasContiguousRoundNumbers(rounds)) {
    return false;
  }

  if (
    !("minigameScoring" in value) ||
    !isGameConfigScoring(value.minigameScoring)
  ) {
    return false;
  }

  if (!("timers" in value) || !isGameConfigTimers(value.timers)) {
    return false;
  }

  if (
    "minigameRules" in value &&
    value.minigameRules !== undefined &&
    !isMinigameRules(value.minigameRules)
  ) {
    return false;
  }

  if (
    "setupPreviewRoundSlots" in value &&
    value.setupPreviewRoundSlots !== undefined &&
    !isSetupPreviewRoundSlots(value.setupPreviewRoundSlots)
  ) {
    return false;
  }

  return true;
};
