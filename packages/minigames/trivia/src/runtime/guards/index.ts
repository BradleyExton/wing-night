import { isNonNegativeInteger, type TriviaChoiceReveal } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { TriviaMinigameState, TriviaRuntimeState } from "../types/index.js";

const isTriviaMinigameState = (
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

const isChoiceRecord = (value: unknown): value is Record<string, number> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((choiceIndex) => isNonNegativeInteger(choiceIndex));
};

const isTriviaChoiceReveal = (value: unknown): value is TriviaChoiceReveal => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const reveal = value as Partial<TriviaChoiceReveal>;

  return (
    typeof reveal.promptId === "string" &&
    Array.isArray(reveal.choices) &&
    reveal.choices.every((choice) => typeof choice === "string") &&
    Array.isArray(reveal.choiceCounts) &&
    reveal.choiceCounts.every((count) => isNonNegativeInteger(count)) &&
    isNonNegativeInteger(reveal.correctIndex) &&
    isNonNegativeInteger(reveal.correctCount) &&
    isNonNegativeInteger(reveal.answeredCount) &&
    isNonNegativeInteger(reveal.seatedCount) &&
    isNonNegativeInteger(reveal.pointsAwarded)
  );
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

  if (!isChoiceRecord(runtimeState.choicesByPlayerId)) {
    return false;
  }

  return runtimeState.reveal === null || isTriviaChoiceReveal(runtimeState.reveal);
};

export const isChooseAnswerPayload = (
  actionPayload: SerializableValue
): actionPayload is Record<"choiceIndex", number> => {
  if (typeof actionPayload !== "object" || actionPayload === null || Array.isArray(actionPayload)) {
    return false;
  }

  return isNonNegativeInteger(actionPayload.choiceIndex);
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
