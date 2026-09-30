import { isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_FAPPY_RULES, type FappyRuntimeRules } from "../types/index.js";

const RULE_KEYS = ["legsPerTurn", "gatesPerLeg", "parSeconds", "limitSeconds"] as const;

// Config-load-time schema check for gameConfig.minigameRules.fappy. Every
// field is optional; when present it must be a positive integer, and a par
// past the limit is refused because the score curve would run backwards.
export const isFappyRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const rules = value as Record<string, unknown>;

  if (!RULE_KEYS.every((key) => rules[key] === undefined || isPositiveInteger(rules[key]))) {
    return false;
  }

  const parSeconds = isPositiveInteger(rules.parSeconds) ? rules.parSeconds : DEFAULT_FAPPY_RULES.parSeconds;
  const limitSeconds = isPositiveInteger(rules.limitSeconds)
    ? rules.limitSeconds
    : DEFAULT_FAPPY_RULES.limitSeconds;

  return parSeconds < limitSeconds;
};

export const resolveFappyRules = (rules: SerializableValue | null): FappyRuntimeRules => {
  if (!isRecord(rules)) {
    return { ...DEFAULT_FAPPY_RULES };
  }

  const parsedRules = rules as Partial<Record<keyof FappyRuntimeRules, unknown>>;
  const resolved: FappyRuntimeRules = {
    legsPerTurn: isPositiveInteger(parsedRules.legsPerTurn)
      ? parsedRules.legsPerTurn
      : DEFAULT_FAPPY_RULES.legsPerTurn,
    gatesPerLeg: isPositiveInteger(parsedRules.gatesPerLeg)
      ? parsedRules.gatesPerLeg
      : DEFAULT_FAPPY_RULES.gatesPerLeg,
    parSeconds: isPositiveInteger(parsedRules.parSeconds)
      ? parsedRules.parSeconds
      : DEFAULT_FAPPY_RULES.parSeconds,
    limitSeconds: isPositiveInteger(parsedRules.limitSeconds)
      ? parsedRules.limitSeconds
      : DEFAULT_FAPPY_RULES.limitSeconds
  };

  return resolved.parSeconds < resolved.limitSeconds
    ? resolved
    : { ...resolved, parSeconds: DEFAULT_FAPPY_RULES.parSeconds, limitSeconds: DEFAULT_FAPPY_RULES.limitSeconds };
};
