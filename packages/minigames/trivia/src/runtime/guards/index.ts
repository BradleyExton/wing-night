import type { SerializableValue } from "@wingnight/minigames-core";

import type { TriviaMinigameState, TriviaRuntimeState } from "../types/index.js";

export const isTriviaMinigameState = (
  value: unknown
): value is TriviaMinigameState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const typedValue = value as Partial<TriviaMinigameState>;

  if (!Array.isArray(typedValue.turnOrderTeamIds)) {
    return false;
  }

  if (!typedValue.turnOrderTeamIds.every((teamId) => typeof teamId === "string")) {
    return false;
  }

  if (
    typeof typedValue.activeTurnIndex !== "number" ||
    !Number.isInteger(typedValue.activeTurnIndex)
  ) {
    return false;
  }

  if (
    typeof typedValue.promptCursor !== "number" ||
    !Number.isInteger(typedValue.promptCursor)
  ) {
    return false;
  }

  if (
    typeof typedValue.pendingPointsByTeamId !== "object" ||
    typedValue.pendingPointsByTeamId === null
  ) {
    return false;
  }

  const pendingPointsValues = Object.values(typedValue.pendingPointsByTeamId);

  if (
    !pendingPointsValues.every(
      (points) => typeof points === "number" && Number.isFinite(points)
    )
  ) {
    return false;
  }

  return true;
};

export const isTriviaRuntimeState = (
  value: SerializableValue
): value is TriviaRuntimeState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const runtimeState = value as Partial<TriviaRuntimeState>;

  if (
    runtimeState.runtimeState === undefined ||
    !isTriviaMinigameState(runtimeState.runtimeState)
  ) {
    return false;
  }

  if (
    typeof runtimeState.attemptsUsedThisTurn !== "number" ||
    !Number.isInteger(runtimeState.attemptsUsedThisTurn) ||
    runtimeState.attemptsUsedThisTurn < 0
  ) {
    return false;
  }

  if (
    typeof runtimeState.questionsPerTurnLimit !== "number" ||
    !Number.isInteger(runtimeState.questionsPerTurnLimit) ||
    runtimeState.questionsPerTurnLimit <= 0
  ) {
    return false;
  }

  return true;
};

export const isRecordAttemptPayload = (
  actionPayload: SerializableValue
): actionPayload is Record<"isCorrect", boolean> => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  if (!("isCorrect" in actionPayload)) {
    return false;
  }

  return typeof actionPayload.isCorrect === "boolean";
};
