import { isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_MOUNT_RULES, type MountRuntimeRules } from "../types/index.js";

const RULE_FIELDS = ["climbSeconds", "secondsPerHen", "pileSeed"] as const;

// Config-load-time schema check for gameConfig.minigameRules.mount. Every field is optional; when
// present each must be a positive integer (spec §0.5).
export const isMountRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return RULE_FIELDS.every((field) => value[field] === undefined || isPositiveInteger(value[field]));
};

export const resolveMountRules = (rules: SerializableValue | null): MountRuntimeRules => {
  if (!isRecord(rules)) {
    return { ...DEFAULT_MOUNT_RULES };
  }

  const pick = (field: (typeof RULE_FIELDS)[number]): number => {
    const value = rules[field];

    return isPositiveInteger(value) ? value : DEFAULT_MOUNT_RULES[field];
  };

  return {
    climbSeconds: pick("climbSeconds"),
    secondsPerHen: pick("secondsPerHen"),
    pileSeed: pick("pileSeed")
  };
};
