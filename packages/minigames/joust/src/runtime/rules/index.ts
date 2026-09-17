import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_JOUST_SHOTS_PER_TURN, type JoustRuntimeRules } from "../types/index.js";

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

// Config-load-time schema check for gameConfig.minigameRules.joust. The single
// field is optional; when present it must be well-formed.
export const isJoustRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (!("shotsPerTurn" in value) || value.shotsPerTurn === undefined) {
    return true;
  }

  return isPositiveInteger(value.shotsPerTurn);
};

export const resolveJoustRules = (rules: SerializableValue | null): JoustRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return { shotsPerTurn: DEFAULT_JOUST_SHOTS_PER_TURN };
  }

  const parsedRules = rules as Partial<JoustRuntimeRules>;

  return {
    shotsPerTurn: isPositiveInteger(parsedRules.shotsPerTurn)
      ? parsedRules.shotsPerTurn
      : DEFAULT_JOUST_SHOTS_PER_TURN
  };
};
