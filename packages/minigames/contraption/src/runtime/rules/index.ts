import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_CONTRAPTION_ATTEMPTS_PER_TURN,
  type ContraptionRuntimeRules
} from "../types/index.js";

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

// Config-load-time schema check for gameConfig.minigameRules.contraption.
// Both fields are optional; when present they must be well-formed.
export const isContraptionRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (
    "attemptsPerTurn" in value &&
    value.attemptsPerTurn !== undefined &&
    !isPositiveInteger(value.attemptsPerTurn)
  ) {
    return false;
  }

  if ("levelId" in value && value.levelId !== undefined && !isNonEmptyString(value.levelId)) {
    return false;
  }

  return true;
};

export const resolveContraptionRules = (
  rules: SerializableValue | null
): ContraptionRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return { attemptsPerTurn: DEFAULT_CONTRAPTION_ATTEMPTS_PER_TURN, levelId: null };
  }

  const parsedRules = rules as Partial<ContraptionRuntimeRules>;

  return {
    attemptsPerTurn: isPositiveInteger(parsedRules.attemptsPerTurn)
      ? parsedRules.attemptsPerTurn
      : DEFAULT_CONTRAPTION_ATTEMPTS_PER_TURN,
    levelId: isNonEmptyString(parsedRules.levelId) ? parsedRules.levelId : null
  };
};
