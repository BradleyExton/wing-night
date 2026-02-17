const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const MINIGAMES = ["TRIVIA", "GEO", "DRAWING"] as const;

export type MinigameType = (typeof MINIGAMES)[number];

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

export type GameConfigTimers = {
  eatingSeconds: number;
  triviaSeconds: number;
  geoSeconds: number;
  drawingSeconds: number;
};

export type GameConfigFile = {
  name: string;
  rounds: GameConfigRound[];
  minigameScoring: GameConfigScoring;
  timers: GameConfigTimers;
};

const isMinigameType = (value: unknown): value is MinigameType => {
  return typeof value === "string" && MINIGAMES.includes(value as MinigameType);
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

  return true;
};
