import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_RECREATE_RULES, type RecreateRuntimeRules } from "../types/index.js";

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

// Config-load-time schema check for gameConfig.minigameRules.recreate. Every
// key is optional and falls back to the default, so a pack only spells out
// what it changes; a key that IS present has to be the right shape.
export const isRecreateRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const rules = value as Record<string, unknown>;

  if (rules.targetsPerTurn !== undefined && !isPositiveInteger(rules.targetsPerTurn)) {
    return false;
  }

  if (
    rules.pointsPerIngredient !== undefined &&
    !isPositiveInteger(rules.pointsPerIngredient)
  ) {
    return false;
  }

  if (rules.liveGeneration !== undefined && typeof rules.liveGeneration !== "boolean") {
    return false;
  }

  return true;
};

export const resolveRecreateRules = (
  rules: SerializableValue | null
): RecreateRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return { ...DEFAULT_RECREATE_RULES };
  }

  const parsedRules = rules as Partial<RecreateRuntimeRules>;

  return {
    targetsPerTurn: isPositiveInteger(parsedRules.targetsPerTurn)
      ? parsedRules.targetsPerTurn
      : DEFAULT_RECREATE_RULES.targetsPerTurn,
    pointsPerIngredient: isPositiveInteger(parsedRules.pointsPerIngredient)
      ? parsedRules.pointsPerIngredient
      : DEFAULT_RECREATE_RULES.pointsPerIngredient,
    liveGeneration:
      typeof parsedRules.liveGeneration === "boolean"
        ? parsedRules.liveGeneration
        : DEFAULT_RECREATE_RULES.liveGeneration
  };
};
