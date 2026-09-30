import { isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_JOUST_SHOTS_PER_PLAYER, type JoustRuntimeRules } from "../types/index.js";

// Config-load-time schema check for gameConfig.minigameRules.joust. The single
// field is optional; when present it must be well-formed.
export const isJoustRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  if (!("shotsPerPlayer" in value) || value.shotsPerPlayer === undefined) {
    return true;
  }

  return isPositiveInteger(value.shotsPerPlayer);
};

export const resolveJoustRules = (rules: SerializableValue | null): JoustRuntimeRules => {
  if (!isRecord(rules)) {
    return { shotsPerPlayer: DEFAULT_JOUST_SHOTS_PER_PLAYER };
  }

  const parsedRules = rules as Partial<JoustRuntimeRules>;

  return {
    shotsPerPlayer: isPositiveInteger(parsedRules.shotsPerPlayer)
      ? parsedRules.shotsPerPlayer
      : DEFAULT_JOUST_SHOTS_PER_PLAYER
  };
};
