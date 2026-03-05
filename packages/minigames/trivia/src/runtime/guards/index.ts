import type { SerializableValue } from "@wingnight/minigames-core";

import { isTriviaMinigameState } from "../../index.js";
import type { TriviaRuntimeState } from "../types/index.js";

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
