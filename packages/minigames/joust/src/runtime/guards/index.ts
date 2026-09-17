import type { JoustAim, JoustHitZone, JoustPhase } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { JoustRuntimeState } from "../types/index.js";

const JOUST_PHASES: readonly JoustPhase[] = ["aiming", "resolved", "done"];
const JOUST_HIT_ZONES: readonly JoustHitZone[] = ["head", "shaft", "balls"];

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

export const isJoustAim = (value: unknown): value is JoustAim => {
  return isObjectLike(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
};

const isJoustPhase = (value: unknown): value is JoustPhase => {
  return JOUST_PHASES.some((phase) => phase === value);
};

const isHitZoneOrNull = (value: unknown): value is JoustHitZone | null => {
  return value === null || JOUST_HIT_ZONES.some((zone) => zone === value);
};

const isShotResult = (value: unknown): boolean => {
  return (
    isObjectLike(value) &&
    isNonNegativeInteger(value.shotNumber) &&
    isHitZoneOrNull(value.hitZone) &&
    isFiniteNumber(value.points)
  );
};

const isShotRun = (value: unknown): boolean => {
  if (!isObjectLike(value) || !Array.isArray(value.keyframes)) {
    return false;
  }

  return (
    isFiniteNumber(value.keyframeHz) &&
    isHitZoneOrNull(value.hitZone) &&
    (value.hitFrameIndex === null || isNonNegativeInteger(value.hitFrameIndex)) &&
    value.keyframes.every(
      (frame) => Array.isArray(frame) && frame.every((entry) => isFiniteNumber(entry))
    )
  );
};

const isLastShotOrNull = (value: unknown): boolean => {
  if (value === null) {
    return true;
  }

  return (
    isShotResult(value) &&
    isObjectLike(value) &&
    isJoustAim(value.aim) &&
    isShotRun(value.run)
  );
};

const isRecordOfNumbers = (value: unknown): value is Record<string, number> => {
  return isObjectLike(value) && Object.values(value).every((entry) => isFiniteNumber(entry));
};

export const isJoustRuntimeState = (
  value: SerializableValue
): value is JoustRuntimeState => {
  if (!isObjectLike(value)) {
    return false;
  }

  const state = value as Partial<JoustRuntimeState>;

  return (
    (state.activeTurnTeamId === null || typeof state.activeTurnTeamId === "string") &&
    (state.arenaId === null || typeof state.arenaId === "string") &&
    isNonNegativeInteger(state.shotsPerTurn) &&
    isNonNegativeInteger(state.shotIndex) &&
    isJoustPhase(state.phase) &&
    isJoustAim(state.aim) &&
    Array.isArray(state.shots) &&
    state.shots.every(isShotResult) &&
    isLastShotOrNull(state.lastShot) &&
    isFiniteNumber(state.turnStartPoints) &&
    isRecordOfNumbers(state.pendingPointsByTeamId)
  );
};

export const isJoustAimPayload = (actionPayload: SerializableValue): actionPayload is JoustAim => {
  return isJoustAim(actionPayload);
};
