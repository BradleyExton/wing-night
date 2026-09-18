import type { FappyLegRunResult, FappyLegStatus, FappyPlayerFigure } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { FappyRuntimeLeg, FappyRuntimeState } from "../types/index.js";

const LEG_STATUSES: readonly FappyLegStatus[] = ["ready", "flying", "cleared"];
const RUN_OUTCOMES: readonly FappyLegRunResult["outcome"][] = ["cleared", "crashed"];

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isFiniteNumberOrNull = (value: unknown): value is number | null => {
  return value === null || isFiniteNumber(value);
};

const isLegStatus = (value: unknown): value is FappyLegStatus => {
  return LEG_STATUSES.some((status) => status === value);
};

const isRunResultOrNull = (value: unknown): value is FappyLegRunResult | null => {
  if (value === null) {
    return true;
  }

  return (
    isObjectLike(value) &&
    isNonNegativeInteger(value.endTick) &&
    isNonNegativeInteger(value.gatesCleared) &&
    RUN_OUTCOMES.some((outcome) => outcome === value.outcome)
  );
};

const isFigureOrNull = (value: unknown): value is FappyPlayerFigure | null => {
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

const isLeg = (value: unknown): value is FappyRuntimeLeg => {
  return (
    isObjectLike(value) &&
    isNonNegativeInteger(value.legIndex) &&
    isFigureOrNull(value.player) &&
    isFiniteNumber(value.seed) &&
    isLegStatus(value.status) &&
    isNonNegativeInteger(value.attempt) &&
    isNonNegativeInteger(value.checkpointGate) &&
    Array.isArray(value.flapTicks) &&
    value.flapTicks.every(isNonNegativeInteger) &&
    isNonNegativeInteger(value.crashes) &&
    typeof value.skipped === "boolean" &&
    Array.isArray(value.knockedEagles) &&
    value.knockedEagles.every(isNonNegativeInteger) &&
    isRunResultOrNull(value.lastRun)
  );
};

const isRecordOfNumbers = (value: unknown): value is Record<string, number> => {
  return isObjectLike(value) && Object.values(value).every((entry) => isFiniteNumber(entry));
};

export const isFappyRuntimeState = (
  value: SerializableValue
): value is FappyRuntimeState => {
  if (!isObjectLike(value)) {
    return false;
  }

  const state = value as Partial<FappyRuntimeState>;

  return (
    (state.activeTurnTeamId === null || typeof state.activeTurnTeamId === "string") &&
    isNonNegativeInteger(state.legsPerTurn) &&
    isNonNegativeInteger(state.gatesPerLeg) &&
    isNonNegativeInteger(state.parSeconds) &&
    isNonNegativeInteger(state.limitSeconds) &&
    isNonNegativeInteger(state.legIndex) &&
    Array.isArray(state.legs) &&
    state.legs.every(isLeg) &&
    isFiniteNumberOrNull(state.startedAtMs) &&
    isFiniteNumberOrNull(state.finishedAtMs) &&
    isFiniteNumberOrNull(state.timedOutAtMs) &&
    isFiniteNumber(state.turnStartPoints) &&
    isRecordOfNumbers(state.pendingPointsByTeamId)
  );
};

export type FappyFlapPayload = {
  tick: number;
};

export const isFappyFlapPayload = (
  actionPayload: SerializableValue
): actionPayload is FappyFlapPayload => {
  return isObjectLike(actionPayload) && isNonNegativeInteger(actionPayload.tick);
};

export const isReceivedAtMs = (value: unknown): value is number => {
  return isFiniteNumber(value);
};
