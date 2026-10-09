import { isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_JOUST_POINTS_PER_TOPPLE,
  DEFAULT_JOUST_SHOTS_PER_PLAYER,
  type JoustRuntimeRules
} from "../types/index.js";

const isOptionalPositiveInteger = (value: unknown): boolean => {
  return value === undefined || isPositiveInteger(value);
};

// Config-load-time schema check for gameConfig.minigameRules.joust. Every field
// is optional; when present it must be well-formed.
export const isJoustRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isOptionalPositiveInteger(value.shotsPerPlayer) &&
    isOptionalPositiveInteger(value.pointsPerTopple)
  );
};

export const resolveJoustRules = (rules: SerializableValue | null): JoustRuntimeRules => {
  const parsedRules = isRecord(rules) ? (rules as Partial<JoustRuntimeRules>) : {};

  return {
    shotsPerPlayer: isPositiveInteger(parsedRules.shotsPerPlayer)
      ? parsedRules.shotsPerPlayer
      : DEFAULT_JOUST_SHOTS_PER_PLAYER,
    pointsPerTopple: isPositiveInteger(parsedRules.pointsPerTopple)
      ? parsedRules.pointsPerTopple
      : DEFAULT_JOUST_POINTS_PER_TOPPLE
  };
};
