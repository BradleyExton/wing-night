import type { SerializableValue } from "@wingnight/minigames-core";

import { DEFAULT_SCHLONIC_RULES, type SchlonicRuntimeRules } from "../types/index.js";

const RULE_KEYS = ["runsPerTurn", "zoneChunks", "parWingsPerRun"] as const;

/**
 * What `parWingsPerRun` was called before the zone was furnished with wings instead of rings.
 * Still honoured, because the night pack's own `gameConfig.json` lives outside the repo and a
 * key this file silently stopped reading would tune nothing and say nothing — the config would
 * load clean and the party would run on the default.
 */
const LEGACY_PAR_KEY = "parRingsPerRun";

/** The zone needs at least a run-up, one piece of kit and a straight to the post. */
const ZONE_CHUNKS_MIN = 6;

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

// The seed alone may be any integer, negative included: it is a hash input, not a count.
const isSeed = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

// Config-load-time schema check for gameConfig.minigameRules.schlonic. Every field is optional;
// when present it must be a positive integer, and a zone shorter than the run-up is refused
// because there would be nothing between the line and the post.
export const isSchlonicRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const rules = value as Record<string, unknown>;

  if (rules.zoneSeed !== undefined && !isSeed(rules.zoneSeed)) {
    return false;
  }

  if (rules[LEGACY_PAR_KEY] !== undefined && !isPositiveInteger(rules[LEGACY_PAR_KEY])) {
    return false;
  }

  if (!RULE_KEYS.every((key) => rules[key] === undefined || isPositiveInteger(rules[key]))) {
    return false;
  }

  return rules.zoneChunks === undefined || (rules.zoneChunks as number) >= ZONE_CHUNKS_MIN;
};

export const resolveSchlonicRules = (rules: SerializableValue | null): SchlonicRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return { ...DEFAULT_SCHLONIC_RULES };
  }

  const parsedRules = rules as Partial<Record<keyof SchlonicRuntimeRules, unknown>> & {
    [LEGACY_PAR_KEY]?: unknown;
  };
  // The new key wins where a pack carries both; the old one still tunes a pack nobody has
  // renamed yet.
  const parWings = isPositiveInteger(parsedRules.parWingsPerRun)
    ? parsedRules.parWingsPerRun
    : parsedRules[LEGACY_PAR_KEY];
  const zoneChunks = isPositiveInteger(parsedRules.zoneChunks)
    ? parsedRules.zoneChunks
    : DEFAULT_SCHLONIC_RULES.zoneChunks;

  return {
    runsPerTurn: isPositiveInteger(parsedRules.runsPerTurn)
      ? parsedRules.runsPerTurn
      : DEFAULT_SCHLONIC_RULES.runsPerTurn,
    zoneSeed: isSeed(parsedRules.zoneSeed) ? parsedRules.zoneSeed : DEFAULT_SCHLONIC_RULES.zoneSeed,
    zoneChunks: Math.max(ZONE_CHUNKS_MIN, zoneChunks),
    parWingsPerRun: isPositiveInteger(parWings) ? parWings : DEFAULT_SCHLONIC_RULES.parWingsPerRun
  };
};
