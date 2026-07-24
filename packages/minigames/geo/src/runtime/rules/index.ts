import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_GEO_PROMPTS_PER_TURN,
  DEFAULT_GEO_SCORE_BANDS_KM,
  type GeoRuntimeRules,
  type GeoScoreBand
} from "../types/index.js";

const normalizePromptsPerTurn = (promptsPerTurn: unknown): number => {
  if (
    typeof promptsPerTurn !== "number" ||
    !Number.isInteger(promptsPerTurn) ||
    promptsPerTurn <= 0
  ) {
    return DEFAULT_GEO_PROMPTS_PER_TURN;
  }

  return promptsPerTurn;
};

const isGeoScoreBand = (value: unknown): value is GeoScoreBand => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const band = value as Partial<GeoScoreBand>;

  if (
    typeof band.maxKm !== "number" ||
    !Number.isFinite(band.maxKm) ||
    band.maxKm <= 0
  ) {
    return false;
  }

  return (
    typeof band.points === "number" &&
    Number.isInteger(band.points) &&
    band.points >= 0
  );
};

const normalizeScoreBandsKm = (scoreBandsKm: unknown): GeoScoreBand[] => {
  if (!Array.isArray(scoreBandsKm) || scoreBandsKm.length === 0) {
    return DEFAULT_GEO_SCORE_BANDS_KM.map((band) => ({ ...band }));
  }

  if (!scoreBandsKm.every((band) => isGeoScoreBand(band))) {
    return DEFAULT_GEO_SCORE_BANDS_KM.map((band) => ({ ...band }));
  }

  return scoreBandsKm
    .map((band) => ({ maxKm: band.maxKm, points: band.points }))
    .sort((left, right) => left.maxKm - right.maxKm);
};

// Config-load-time schema check for gameConfig.minigameRules.geo. Both
// fields are optional; when present they must be well-formed.
export const isGeoRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (
    "promptsPerTurn" in value &&
    value.promptsPerTurn !== undefined &&
    !(
      typeof value.promptsPerTurn === "number" &&
      Number.isInteger(value.promptsPerTurn) &&
      value.promptsPerTurn > 0
    )
  ) {
    return false;
  }

  if ("scoreBandsKm" in value && value.scoreBandsKm !== undefined) {
    if (!Array.isArray(value.scoreBandsKm) || value.scoreBandsKm.length === 0) {
      return false;
    }

    if (!value.scoreBandsKm.every((band) => isGeoScoreBand(band))) {
      return false;
    }
  }

  return true;
};

export const resolveGeoRules = (
  rules: SerializableValue | null
): GeoRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return {
      promptsPerTurn: DEFAULT_GEO_PROMPTS_PER_TURN,
      scoreBandsKm: DEFAULT_GEO_SCORE_BANDS_KM.map((band) => ({ ...band }))
    };
  }

  const parsedRules = rules as Partial<GeoRuntimeRules>;

  return {
    promptsPerTurn: normalizePromptsPerTurn(parsedRules.promptsPerTurn),
    scoreBandsKm: normalizeScoreBandsKm(parsedRules.scoreBandsKm)
  };
};
