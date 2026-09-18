import type {
  SpotterCell,
  SpotterDirection,
  SpotterShotResult
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { SpotterRuntimeState, SpotterScoreBand } from "../types/index.js";

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

export const isSpotterDirection = (value: unknown): value is SpotterDirection => {
  return value === "U" || value === "D" || value === "L" || value === "R";
};

export const isSpotterCell = (value: unknown): value is SpotterCell => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const cell = value as Partial<SpotterCell>;

  return isNonNegativeInteger(cell.col) && isNonNegativeInteger(cell.row);
};

const isSpotterScoreBand = (value: unknown): value is SpotterScoreBand => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const band = value as Partial<SpotterScoreBand>;

  return isNonNegativeInteger(band.maxCells) && isNonNegativeInteger(band.points);
};

const isSpotterShotResult = (value: unknown): value is SpotterShotResult => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const result = value as Partial<SpotterShotResult>;

  return (
    isNonNegativeInteger(result.targetIndex) &&
    isNonNegativeInteger(result.col) &&
    isNonNegativeInteger(result.row) &&
    isNonNegativeInteger(result.distanceCells) &&
    (result.band === "HIT" || result.band === "CLOSE" || result.band === "MISS") &&
    isNonNegativeInteger(result.points)
  );
};

export const isSpotterRuntimeState = (
  value: SerializableValue
): value is SpotterRuntimeState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const state = value as Partial<SpotterRuntimeState>;

  if (state.activeTurnTeamId !== null && typeof state.activeTurnTeamId !== "string") {
    return false;
  }

  if (
    typeof state.pendingPointsByTeamId !== "object" ||
    state.pendingPointsByTeamId === null ||
    Array.isArray(state.pendingPointsByTeamId)
  ) {
    return false;
  }

  if (!isNonNegativeInteger(state.seed)) {
    return false;
  }

  if (!isNonNegativeInteger(state.gridCols) || !isNonNegativeInteger(state.gridRows)) {
    return false;
  }

  if (
    !Array.isArray(state.scoreBandsCells) ||
    !state.scoreBandsCells.every((band) => isSpotterScoreBand(band))
  ) {
    return false;
  }

  if (!Array.isArray(state.targets) || !state.targets.every((cell) => isSpotterCell(cell))) {
    return false;
  }

  if (!isNonNegativeInteger(state.targetIndex)) {
    return false;
  }

  if (!isSpotterCell(state.cursor)) {
    return false;
  }

  if (!Array.isArray(state.path) || !state.path.every((step) => isSpotterDirection(step))) {
    return false;
  }

  return (
    Array.isArray(state.results) &&
    state.results.every((result) => isSpotterShotResult(result))
  );
};

export const isNudgePayload = (
  value: SerializableValue
): value is { direction: SpotterDirection } => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return isSpotterDirection((value as { direction?: unknown }).direction);
};
