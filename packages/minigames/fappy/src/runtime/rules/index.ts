import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_FAPPY_RULES, type FappyRuntimeRules } from "../types/index.js";

const RULE_KEYS = ["legsPerTurn", "gatesPerLeg", "pointsPerGate"] as const;

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

// Config-load-time schema check for gameConfig.minigameRules.fappy. Every
// field is optional; when present it must be a positive integer.
export const isFappyRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const rules = value as Record<string, unknown>;

  return RULE_KEYS.every((key) => rules[key] === undefined || isPositiveInteger(rules[key]));
};

export const resolveFappyRules = (rules: SerializableValue | null): FappyRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return { ...DEFAULT_FAPPY_RULES };
  }

  const parsedRules = rules as Partial<Record<keyof FappyRuntimeRules, unknown>>;

  return {
    legsPerTurn: isPositiveInteger(parsedRules.legsPerTurn)
      ? parsedRules.legsPerTurn
      : DEFAULT_FAPPY_RULES.legsPerTurn,
    gatesPerLeg: isPositiveInteger(parsedRules.gatesPerLeg)
      ? parsedRules.gatesPerLeg
      : DEFAULT_FAPPY_RULES.gatesPerLeg,
    pointsPerGate: isPositiveInteger(parsedRules.pointsPerGate)
      ? parsedRules.pointsPerGate
      : DEFAULT_FAPPY_RULES.pointsPerGate
  };
};
