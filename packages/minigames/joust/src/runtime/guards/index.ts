import {
  isFiniteNumber,
  isNonNegativeInteger,
  isNumberRecord,
  isRecord,
  isStringArray,
  type JoustAim,
  type JoustPhase
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { JoustRuntimeState } from "../types/index.js";

const JOUST_PHASES: readonly JoustPhase[] = ["aiming", "resolved", "done"];

export const isJoustAim = (value: unknown): value is JoustAim => {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
};

const isJoustPhase = (value: unknown): value is JoustPhase => {
  return JOUST_PHASES.some((phase) => phase === value);
};

const isIndexArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every(isNonNegativeInteger);
};

const isPlayerFigure = (value: unknown): boolean => {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.name === "string" &&
    (value.avatarSrc === null || typeof value.avatarSrc === "string")
  );
};

const isShotResult = (value: unknown): boolean => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.shotNumber) &&
    isStringArray(value.toppledPlayerIds) &&
    isIndexArray(value.collapsedPerchIndices) &&
    typeof value.isRackCleared === "boolean" &&
    isFiniteNumber(value.points)
  );
};

const isTopple = (value: unknown): boolean => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.pinIndex) &&
    isNonNegativeInteger(value.frameIndex)
  );
};

const isCollapse = (value: unknown): boolean => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.perchIndex) &&
    isNonNegativeInteger(value.frameIndex)
  );
};

const isShotRun = (value: unknown): boolean => {
  if (
    !isRecord(value) ||
    !Array.isArray(value.keyframes) ||
    !Array.isArray(value.topples) ||
    !Array.isArray(value.collapses)
  ) {
    return false;
  }

  return (
    isFiniteNumber(value.keyframeHz) &&
    value.topples.every(isTopple) &&
    value.collapses.every(isCollapse) &&
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
    isRecord(value) &&
    isJoustAim(value.aim) &&
    typeof value.shooterId === "string" &&
    isStringArray(value.pinPlayerIds) &&
    isIndexArray(value.rubblePerchIndices) &&
    isShotRun(value.run)
  );
};

const isGhostOrNull = (value: unknown): boolean => {
  if (value === null) {
    return true;
  }

  return (
    isRecord(value) &&
    isNonNegativeInteger(value.shotNumber) &&
    isJoustAim(value.aim) &&
    typeof value.shooterId === "string" &&
    Array.isArray(value.path) &&
    value.path.every(isJoustAim)
  );
};

export const isJoustRuntimeState = (
  value: SerializableValue
): value is JoustRuntimeState => {
  if (!isRecord(value)) {
    return false;
  }

  const state = value as Partial<JoustRuntimeState>;

  return (
    (state.activeTurnTeamId === null || typeof state.activeTurnTeamId === "string") &&
    (state.arenaId === null || typeof state.arenaId === "string") &&
    Array.isArray(state.lineup) &&
    state.lineup.every(isPlayerFigure) &&
    Array.isArray(state.teammates) &&
    state.teammates.every(isPlayerFigure) &&
    isStringArray(state.downPlayerIds) &&
    isIndexArray(state.collapsedPerchIndices) &&
    isGhostOrNull(state.previousShotGhost) &&
    typeof state.selectedShooterId === "string" &&
    isStringArray(state.usedShooterIds) &&
    isNonNegativeInteger(state.shotsPerTurn) &&
    isNonNegativeInteger(state.pointsPerTopple) &&
    isNonNegativeInteger(state.shotIndex) &&
    isJoustPhase(state.phase) &&
    isJoustAim(state.aim) &&
    Array.isArray(state.shots) &&
    state.shots.every(isShotResult) &&
    isLastShotOrNull(state.lastShot) &&
    isFiniteNumber(state.turnStartPoints) &&
    isNumberRecord(state.pendingPointsByTeamId)
  );
};

export const isJoustAimPayload = (actionPayload: SerializableValue): actionPayload is JoustAim => {
  return isJoustAim(actionPayload);
};

export type JoustPickShooterPayload = {
  shooterId: string;
};

export const isJoustPickShooterPayload = (
  actionPayload: SerializableValue
): actionPayload is JoustPickShooterPayload => {
  return isRecord(actionPayload) && typeof actionPayload.shooterId === "string";
};
