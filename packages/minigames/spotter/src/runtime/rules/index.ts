import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_SPOTTER_GRID_COLS,
  DEFAULT_SPOTTER_GRID_ROWS,
  DEFAULT_SPOTTER_SCORE_BANDS_CELLS,
  DEFAULT_SPOTTER_TARGETS_PER_TURN,
  MAX_SPOTTER_GRID_COLS,
  MAX_SPOTTER_GRID_ROWS,
  MIN_SPOTTER_GRID_COLS,
  MIN_SPOTTER_GRID_ROWS,
  type SpotterRuntimeRules,
  type SpotterScoreBand
} from "../types/index.js";

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isIntegerWithin = (value: unknown, min: number, max: number): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
};

const isSpotterScoreBand = (value: unknown): value is SpotterScoreBand => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const band = value as Partial<SpotterScoreBand>;

  return (
    typeof band.maxCells === "number" &&
    Number.isInteger(band.maxCells) &&
    band.maxCells >= 0 &&
    typeof band.points === "number" &&
    Number.isInteger(band.points) &&
    band.points >= 0
  );
};

const cloneDefaultBands = (): SpotterScoreBand[] => {
  return DEFAULT_SPOTTER_SCORE_BANDS_CELLS.map((band) => ({ ...band }));
};

const normalizeScoreBands = (scoreBandsCells: unknown): SpotterScoreBand[] => {
  if (!Array.isArray(scoreBandsCells) || scoreBandsCells.length === 0) {
    return cloneDefaultBands();
  }

  if (!scoreBandsCells.every((band) => isSpotterScoreBand(band))) {
    return cloneDefaultBands();
  }

  return scoreBandsCells
    .map((band) => ({ maxCells: band.maxCells, points: band.points }))
    .sort((left, right) => left.maxCells - right.maxCells);
};

// Config-load-time schema check for gameConfig.minigameRules.spotter. Every
// field is optional; when present it must be well-formed.
export const isSpotterRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const rules = value as Record<string, unknown>;

  if (rules.targetsPerTurn !== undefined && !isPositiveInteger(rules.targetsPerTurn)) {
    return false;
  }

  if (
    rules.gridCols !== undefined &&
    !isIntegerWithin(rules.gridCols, MIN_SPOTTER_GRID_COLS, MAX_SPOTTER_GRID_COLS)
  ) {
    return false;
  }

  if (
    rules.gridRows !== undefined &&
    !isIntegerWithin(rules.gridRows, MIN_SPOTTER_GRID_ROWS, MAX_SPOTTER_GRID_ROWS)
  ) {
    return false;
  }

  if (rules.scoreBandsCells !== undefined) {
    if (!Array.isArray(rules.scoreBandsCells) || rules.scoreBandsCells.length === 0) {
      return false;
    }

    if (!rules.scoreBandsCells.every((band) => isSpotterScoreBand(band))) {
      return false;
    }
  }

  if (
    rules.seed !== undefined &&
    !(typeof rules.seed === "number" && Number.isInteger(rules.seed))
  ) {
    return false;
  }

  return true;
};

export const resolveSpotterRules = (
  rules: SerializableValue | null
): SpotterRuntimeRules => {
  const defaults: SpotterRuntimeRules = {
    targetsPerTurn: DEFAULT_SPOTTER_TARGETS_PER_TURN,
    gridCols: DEFAULT_SPOTTER_GRID_COLS,
    gridRows: DEFAULT_SPOTTER_GRID_ROWS,
    scoreBandsCells: cloneDefaultBands(),
    seed: null
  };

  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return defaults;
  }

  const parsedRules = rules as Record<string, unknown>;

  return {
    targetsPerTurn: isPositiveInteger(parsedRules.targetsPerTurn)
      ? parsedRules.targetsPerTurn
      : defaults.targetsPerTurn,
    gridCols: isIntegerWithin(parsedRules.gridCols, MIN_SPOTTER_GRID_COLS, MAX_SPOTTER_GRID_COLS)
      ? parsedRules.gridCols
      : defaults.gridCols,
    gridRows: isIntegerWithin(parsedRules.gridRows, MIN_SPOTTER_GRID_ROWS, MAX_SPOTTER_GRID_ROWS)
      ? parsedRules.gridRows
      : defaults.gridRows,
    scoreBandsCells: normalizeScoreBands(parsedRules.scoreBandsCells),
    seed:
      typeof parsedRules.seed === "number" && Number.isInteger(parsedRules.seed)
        ? parsedRules.seed
        : null
  };
};
