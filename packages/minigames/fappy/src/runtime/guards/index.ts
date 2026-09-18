import type { FappyLegOutcome, FappyLegStatus } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { FappyRuntimeLeg, FappyRuntimeState } from "../types/index.js";

const LEG_STATUSES: readonly FappyLegStatus[] = ["ready", "flying", "landed"];
const LEG_OUTCOMES: readonly FappyLegOutcome[] = ["cleared", "crashed", "skipped"];

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isLegStatus = (value: unknown): value is FappyLegStatus => {
  return LEG_STATUSES.some((status) => status === value);
};

const isLegOutcomeOrNull = (value: unknown): value is FappyLegOutcome | null => {
  return value === null || LEG_OUTCOMES.some((outcome) => outcome === value);
};

const isLeg = (value: unknown): value is FappyRuntimeLeg => {
  return (
    isObjectLike(value) &&
    isNonNegativeInteger(value.legIndex) &&
    (value.playerId === null || typeof value.playerId === "string") &&
    isFiniteNumber(value.seed) &&
    isLegStatus(value.status) &&
    Array.isArray(value.flapTicks) &&
    value.flapTicks.every(isNonNegativeInteger) &&
    isNonNegativeInteger(value.gatesCleared) &&
    (value.endTick === null || isNonNegativeInteger(value.endTick)) &&
    isLegOutcomeOrNull(value.outcome)
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
    isNonNegativeInteger(state.pointsPerGate) &&
    isNonNegativeInteger(state.legIndex) &&
    Array.isArray(state.legs) &&
    state.legs.every(isLeg) &&
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
