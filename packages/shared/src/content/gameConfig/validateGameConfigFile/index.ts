import type { ValidationIssue } from "../../validationIssue/index.js";
import {
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPES,
  type MinigameRulesKey,
  type MinigameTimerKey,
  type MinigameType
} from "../minigameDefinitions/index.js";

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

// Injected by the caller that CAN reach the minigame plugins. `packages/shared`
// has no dependencies and `packages/minigames/core` depends on it, so resolving
// a runtime plugin here would invert the dependency graph — the server passes
// its plugin-backed validator in instead. Omitted ⇒ no rules issues, which is
// what keeps `isGameConfigFile` exactly as strict as it has always been.
export type ValidateMinigameRules = (
  rulesKey: string,
  rules: unknown
) => boolean;

export type ValidateGameConfigFileOptions = {
  validateRules?: ValidateMinigameRules;
};

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

// Deliberately array-permissive to match the guard this replaces: the previous
// `typeof x === "object" && x !== null` checks accepted arrays too, and
// tightening that here would reject content the loader accepts today.
const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isRuleRecord = (value: unknown): boolean => {
  return isObjectLike(value) && !Array.isArray(value);
};

const isMinigameType = (value: unknown): value is MinigameType => {
  return typeof value === "string" && MINIGAME_TYPES.includes(value as MinigameType);
};

const REQUIRED_TIMER_KEYS: readonly string[] = [
  "eatingSeconds",
  ...MINIGAME_TYPES.map((minigameType) => MINIGAME_DEFINITIONS[minigameType].timerKey)
];

// The rules keys shared owns, in registration order. The seam offers only
// these to the injected validator, mirroring the server's historical
// MINIGAME_TYPES walk so an unrecognised `minigameRules` key stays ignored.
const MINIGAME_RULES_KEYS: readonly MinigameRulesKey[] = MINIGAME_TYPES.map(
  (minigameType) => MINIGAME_DEFINITIONS[minigameType].rulesKey
).filter((rulesKey): rulesKey is MinigameRulesKey => rulesKey !== null);

const validateRound = (value: unknown, index: number): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: `rounds[${index}]`, message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];
  const fieldPath = (field: string): string => `rounds[${index}].${field}`;

  if (!isPositiveInteger(value.round)) {
    issues.push({
      path: fieldPath("round"),
      message: "must be a positive integer"
    });
  } else if (value.round !== index + 1) {
    issues.push({
      path: fieldPath("round"),
      message: `must be ${index + 1} so round numbers stay contiguous`
    });
  }

  if (!isNonEmptyString(value.label)) {
    issues.push({ path: fieldPath("label"), message: "must be a non-empty string" });
  }

  if (!isNonEmptyString(value.sauce)) {
    issues.push({ path: fieldPath("sauce"), message: "must be a non-empty string" });
  }

  if (!isPositiveInteger(value.pointsPerPlayer)) {
    issues.push({
      path: fieldPath("pointsPerPlayer"),
      message: "must be a positive integer"
    });
  }

  if (!isMinigameType(value.minigame)) {
    issues.push({
      path: fieldPath("minigame"),
      message: `must be one of ${MINIGAME_TYPES.join(", ")}`
    });
  }

  return issues;
};

const validateScoring = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "minigameScoring", message: "must be an object" }];
  }

  return (["defaultMax", "finalRoundMax"] as const)
    .filter((scoringKey) => !isPositiveInteger(value[scoringKey]))
    .map((scoringKey) => ({
      path: `minigameScoring.${scoringKey}`,
      message: "must be a positive integer"
    }));
};

const validateTimers = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "timers", message: "must be an object" }];
  }

  return REQUIRED_TIMER_KEYS.filter(
    (timerKey) => !isPositiveInteger(value[timerKey])
  ).map((timerKey) => ({
    path: `timers.${timerKey}`,
    message: "must be a positive integer number of seconds"
  }));
};

const validateMinigameRules = (
  value: unknown,
  validateRules?: ValidateMinigameRules
): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [
      { path: "minigameRules", message: "must be an object keyed by rules key" }
    ];
  }

  const issues: ValidationIssue[] = [];
  const malformedKeys = new Set<string>();

  for (const [rulesKey, rulesEntry] of Object.entries(value)) {
    if (rulesEntry === undefined || isRuleRecord(rulesEntry)) {
      continue;
    }

    malformedKeys.add(rulesKey);
    issues.push({
      path: `minigameRules.${rulesKey}`,
      message: "must be an object"
    });
  }

  if (validateRules === undefined) {
    return issues;
  }

  for (const rulesKey of MINIGAME_RULES_KEYS) {
    const rulesEntry = value[rulesKey];

    // A key whose outer shape already failed has its issue; don't double-report
    // it by handing known-bad input to the plugin.
    if (rulesEntry === undefined || malformedKeys.has(rulesKey)) {
      continue;
    }

    if (!validateRules(rulesKey, rulesEntry)) {
      issues.push({
        path: `minigameRules.${rulesKey}`,
        message: "failed the owning minigame's rules validation"
      });
    }
  }

  return issues;
};

// The game config schema, as an error-accumulating validator: it reports EVERY
// rule a value breaks rather than stopping at the first, so an editor can show
// all of them at once. `isGameConfigFile` below is the same rules, read as a
// boolean — the two can never disagree because there is only one implementation.
export const validateGameConfigFile = (
  value: unknown,
  options: ValidateGameConfigFileOptions = {}
): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  if (!isNonEmptyString(value.name)) {
    issues.push({ path: "name", message: "must be a non-empty string" });
  }

  if (!Array.isArray(value.rounds)) {
    issues.push({ path: "rounds", message: "must be an array" });
  } else if (value.rounds.length === 0) {
    issues.push({ path: "rounds", message: "must contain at least one round" });
  } else {
    value.rounds.forEach((round, index) => {
      issues.push(...validateRound(round, index));
    });
  }

  issues.push(...validateScoring(value.minigameScoring));
  issues.push(...validateTimers(value.timers));

  if (value.minigameRules !== undefined) {
    issues.push(...validateMinigameRules(value.minigameRules, options.validateRules));
  }

  if (
    value.setupPreviewRoundSlots !== undefined &&
    !(
      isPositiveInteger(value.setupPreviewRoundSlots) &&
      value.setupPreviewRoundSlots <= SETUP_PREVIEW_ROUND_SLOTS_MAX
    )
  ) {
    issues.push({
      path: "setupPreviewRoundSlots",
      message: `must be a positive integer no greater than ${SETUP_PREVIEW_ROUND_SLOTS_MAX}`
    });
  }

  return issues;
};

export const isGameConfigFile = (value: unknown): value is GameConfigFile => {
  return validateGameConfigFile(value).length === 0;
};
