import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_JOUST_SHOTS_PER_PLAYER, type JoustRuntimeRules } from "../types/index.js";

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

// Config-load-time schema check for gameConfig.minigameRules.joust. The single
// field is optional; when present it must be well-formed.
export const isJoustRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (!("shotsPerPlayer" in value) || value.shotsPerPlayer === undefined) {
    return true;
  }

  return isPositiveInteger(value.shotsPerPlayer);
};

export const resolveJoustRules = (rules: SerializableValue | null): JoustRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return { shotsPerPlayer: DEFAULT_JOUST_SHOTS_PER_PLAYER };
  }

  const parsedRules = rules as Partial<JoustRuntimeRules>;

  return {
    shotsPerPlayer: isPositiveInteger(parsedRules.shotsPerPlayer)
      ? parsedRules.shotsPerPlayer
      : DEFAULT_JOUST_SHOTS_PER_PLAYER
  };
};
