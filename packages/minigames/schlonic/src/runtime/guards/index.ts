import type {
  SchlonicOutcome,
  SchlonicPlayerFigure,
  SchlonicRunResult,
  SchlonicRunStatus
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { SchlonicRuntimeRun, SchlonicRuntimeState } from "../types/index.js";

const RUN_STATUSES: readonly SchlonicRunStatus[] = ["ready", "running", "done"];
const OUTCOMES: readonly SchlonicOutcome[] = ["cleared", "wiped", "fell"];

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

const isRunStatus = (value: unknown): value is SchlonicRunStatus => {
  return RUN_STATUSES.some((status) => status === value);
};

const isResultOrNull = (value: unknown): value is SchlonicRunResult | null => {
  if (value === null) {
    return true;
  }

  return (
    isObjectLike(value) &&
    OUTCOMES.some((outcome) => outcome === value.outcome) &&
    isNonNegativeInteger(value.endTick) &&
    isNonNegativeInteger(value.rings) &&
    isFiniteNumber(value.distance)
  );
};

const isFigureOrNull = (value: unknown): value is SchlonicPlayerFigure | null => {
  if (value === null) {
    return true;
  }

  return (
    isObjectLike(value) &&
    typeof value.playerId === "string" &&
    typeof value.name === "string" &&
    (value.avatarSrc === null || typeof value.avatarSrc === "string") &&
    (value.teamId === null || typeof value.teamId === "string") &&
    (value.genre === null || typeof value.genre === "string")
  );
};

const isInput = (value: unknown): boolean => {
  return isObjectLike(value) && isNonNegativeInteger(value.tick) && typeof value.down === "boolean";
};

const isRun = (value: unknown): value is SchlonicRuntimeRun => {
  return (
    isObjectLike(value) &&
    isNonNegativeInteger(value.runIndex) &&
    isFigureOrNull(value.player) &&
    isRunStatus(value.status) &&
    Array.isArray(value.inputs) &&
    value.inputs.every(isInput) &&
    typeof value.skipped === "boolean" &&
    isResultOrNull(value.result)
  );
};

const isRecordOfNumbers = (value: unknown): value is Record<string, number> => {
  return isObjectLike(value) && Object.values(value).every((entry) => isFiniteNumber(entry));
};

export const isSchlonicRuntimeState = (
  value: SerializableValue
): value is SchlonicRuntimeState => {
  if (!isObjectLike(value)) {
    return false;
  }

  const state = value as Partial<SchlonicRuntimeState>;

  return (
    (state.activeTurnTeamId === null || typeof state.activeTurnTeamId === "string") &&
    isNonNegativeInteger(state.runsPerTurn) &&
    isInteger(state.zoneSeed) &&
    isNonNegativeInteger(state.zoneChunks) &&
    isNonNegativeInteger(state.parRingsPerRun) &&
    isNonNegativeInteger(state.runIndex) &&
    Array.isArray(state.runs) &&
    state.runs.every(isRun) &&
    isFiniteNumber(state.turnStartPoints) &&
    isRecordOfNumbers(state.pendingPointsByTeamId)
  );
};

export type SchlonicTickPayload = {
  tick: number;
};

export const isSchlonicTickPayload = (
  actionPayload: SerializableValue
): actionPayload is SchlonicTickPayload => {
  return isObjectLike(actionPayload) && isNonNegativeInteger(actionPayload.tick);
};
