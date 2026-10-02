import { isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_BRAWL_RULES, type BrawlRuntimeRules } from "../types/index.js";

// The seed alone may be any integer, negative included: it is a hash input, not a count.
const isSeed = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

// Config-load-time schema check for gameConfig.minigameRules.brawl. Every field is optional;
// when present the block count and the heart's price must be positive integers and the seed an
// integer.
export const isBrawlRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const rules = value as Record<string, unknown>;

  if (rules.courseSeed !== undefined && !isSeed(rules.courseSeed)) {
    return false;
  }

  if (rules.heartPrice !== undefined && !isPositiveInteger(rules.heartPrice)) {
    return false;
  }

  return rules.blocksPerTurn === undefined || isPositiveInteger(rules.blocksPerTurn);
};

export const resolveBrawlRules = (rules: SerializableValue | null): BrawlRuntimeRules => {
  if (!isRecord(rules)) {
    return { ...DEFAULT_BRAWL_RULES };
  }

  const parsedRules = rules as Partial<Record<keyof BrawlRuntimeRules, unknown>>;

  return {
    blocksPerTurn: isPositiveInteger(parsedRules.blocksPerTurn)
      ? parsedRules.blocksPerTurn
      : DEFAULT_BRAWL_RULES.blocksPerTurn,
    courseSeed: isSeed(parsedRules.courseSeed) ? parsedRules.courseSeed : DEFAULT_BRAWL_RULES.courseSeed,
    heartPrice: isPositiveInteger(parsedRules.heartPrice) ? parsedRules.heartPrice : DEFAULT_BRAWL_RULES.heartPrice
  };
};
