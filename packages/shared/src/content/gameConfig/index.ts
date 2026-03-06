const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const MINIGAME_API_VERSION = 1;

export type GameConfigTimers = {
  eatingSeconds: number;
  triviaSeconds: number;
  geoSeconds: number;
  drawingSeconds: number;
};

export type TriviaMinigameRules = {
  questionsPerTurn: number;
};

export type MinigameRules = {
  trivia?: TriviaMinigameRules;
};

export type MinigameTimerKey = keyof GameConfigTimers;
export type MinigameRulesKey = keyof MinigameRules;

export type MinigameContractMetadataDefaults = {
  minigameApiVersion: number;
  capabilityFlags: readonly string[];
};

export type MinigameDefinition = {
  id: string;
  slug: string;
  timerKey: MinigameTimerKey;
  rulesKey: MinigameRulesKey | null;
  contractMetadata: MinigameContractMetadataDefaults;
};

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
    rulesKey: null,
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: []
    }
  },
  DRAWING: {
    id: "DRAWING",
    slug: "drawing",
    timerKey: "drawingSeconds",
    rulesKey: null,
    contractMetadata: {
      minigameApiVersion: MINIGAME_API_VERSION,
      capabilityFlags: []
    }
  }
} as const satisfies Record<string, MinigameDefinition>;

export type MinigameType = keyof typeof MINIGAME_DEFINITIONS;

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

const isGameConfigTimers = (value: unknown): value is GameConfigTimers => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("eatingSeconds" in value) || !isPositiveInteger(value.eatingSeconds)) {
    return false;
  }

  if (!("triviaSeconds" in value) || !isPositiveInteger(value.triviaSeconds)) {
    return false;
  }

  if (!("geoSeconds" in value) || !isPositiveInteger(value.geoSeconds)) {
    return false;
  }

  if (
    !("drawingSeconds" in value) ||
    !isPositiveInteger(value.drawingSeconds)
  ) {
    return false;
  }

  return true;
};

const isTriviaMinigameRules = (
  value: unknown
): value is TriviaMinigameRules => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("questionsPerTurn" in value) ||
    !isPositiveInteger(value.questionsPerTurn)
  ) {
    return false;
  }

  return true;
};

const isMinigameRules = (value: unknown): value is MinigameRules => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    "trivia" in value &&
    value.trivia !== undefined &&
    !isTriviaMinigameRules(value.trivia)
  ) {
    return false;
  }

  return true;
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
