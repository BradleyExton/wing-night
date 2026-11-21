import { BORDEN_STRETCHES, isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_BORDEN_RULES, type BordenRuntimeRules } from "../types/index.js";

// The seed alone may be any integer, negative included: it is a hash input, not a count.
const isSeed = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

// The base has three stretches, and a game runs from the first: one to three of them.
const isStretchCount = (value: unknown): value is number => {
  return isPositiveInteger(value) && value <= BORDEN_STRETCHES;
};

// Config-load-time schema check for gameConfig.minigameRules.borden. Every field is optional;
// when present the stretch count must be one to three and the seed an integer.
export const isBordenRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const rules = value as Record<string, unknown>;

  if (rules.courseSeed !== undefined && !isSeed(rules.courseSeed)) {
    return false;
  }

  return rules.stretchesPerTurn === undefined || isStretchCount(rules.stretchesPerTurn);
};

export const resolveBordenRules = (rules: SerializableValue | null): BordenRuntimeRules => {
  if (!isRecord(rules)) {
    return { ...DEFAULT_BORDEN_RULES };
  }

  const parsedRules = rules as Partial<Record<keyof BordenRuntimeRules, unknown>>;

  return {
    stretchesPerTurn: isStretchCount(parsedRules.stretchesPerTurn)
      ? parsedRules.stretchesPerTurn
      : DEFAULT_BORDEN_RULES.stretchesPerTurn,
    courseSeed: isSeed(parsedRules.courseSeed) ? parsedRules.courseSeed : DEFAULT_BORDEN_RULES.courseSeed
  };
};
