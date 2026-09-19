import type { RecreateAttempt } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { RecreateRuntimeState } from "../types/index.js";

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
};

const isAttemptStatus = (value: unknown): value is RecreateAttempt["status"] => {
  return (
    value === "generating" || value === "ready" || value === "failed" || value === "skipped"
  );
};

const isAttempt = (value: unknown): value is RecreateAttempt => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const attempt = value as Partial<RecreateAttempt>;

  return (
    typeof attempt.attemptId === "string" &&
    typeof attempt.prompt === "string" &&
    isAttemptStatus(attempt.status) &&
    (attempt.imageSrc === null || typeof attempt.imageSrc === "string") &&
    (attempt.failureReason === null || typeof attempt.failureReason === "string")
  );
};

export const isRecreateRuntimeState = (
  value: SerializableValue
): value is RecreateRuntimeState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const state = value as Partial<RecreateRuntimeState>;

  if (!isStringArray(state.turnOrderTeamIds)) {
    return false;
  }

  if (
    !isNonNegativeInteger(state.activeTurnIndex) ||
    !isNonNegativeInteger(state.promptCursor) ||
    !isNonNegativeInteger(state.targetsCompletedThisTurn) ||
    !isNonNegativeInteger(state.attemptSequence)
  ) {
    return false;
  }

  if (
    !isNonNegativeInteger(state.targetsPerTurn) ||
    state.targetsPerTurn === 0 ||
    !isNonNegativeInteger(state.pointsPerIngredient) ||
    state.pointsPerIngredient === 0
  ) {
    return false;
  }

  if (typeof state.liveGeneration !== "boolean") {
    return false;
  }

  if (
    state.subState !== "writing" &&
    state.subState !== "judging" &&
    state.subState !== "scored"
  ) {
    return false;
  }

  if (state.attempt !== null && !isAttempt(state.attempt)) {
    return false;
  }

  if (
    !Array.isArray(state.checkedIngredientIndexes) ||
    !state.checkedIngredientIndexes.every(isNonNegativeInteger)
  ) {
    return false;
  }

  if (
    state.lastPointsAwarded !== null &&
    (typeof state.lastPointsAwarded !== "number" || !Number.isFinite(state.lastPointsAwarded))
  ) {
    return false;
  }

  if (typeof state.pendingPointsByTeamId !== "object" || state.pendingPointsByTeamId === null) {
    return false;
  }

  return Object.values(state.pendingPointsByTeamId).every(
    (points) => typeof points === "number" && Number.isFinite(points)
  );
};

export const isSubmitPromptPayload = (
  actionPayload: SerializableValue
): actionPayload is { prompt: string } => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  return "prompt" in actionPayload && typeof actionPayload.prompt === "string";
};

export const isResolveGenerationPayload = (
  actionPayload: SerializableValue
): actionPayload is {
  attemptId: string;
  imageSrc: string | null;
  failureReason: string | null;
} => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  if (!("attemptId" in actionPayload) || typeof actionPayload.attemptId !== "string") {
    return false;
  }

  const imageSrc = "imageSrc" in actionPayload ? actionPayload.imageSrc : undefined;
  const failureReason =
    "failureReason" in actionPayload ? actionPayload.failureReason : undefined;

  return (
    (imageSrc === null || typeof imageSrc === "string") &&
    (failureReason === null || typeof failureReason === "string")
  );
};

export const isToggleIngredientPayload = (
  actionPayload: SerializableValue
): actionPayload is { ingredientIndex: number } => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  return (
    "ingredientIndex" in actionPayload && isNonNegativeInteger(actionPayload.ingredientIndex)
  );
};
