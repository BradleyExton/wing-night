import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_TRIVIA_QUESTIONS_PER_TURN,
  type TriviaRuntimeRules
} from "../types/index.js";

const isQuestionsPerTurn = (questionsPerTurn: unknown): questionsPerTurn is number => {
  return (
    typeof questionsPerTurn === "number" &&
    Number.isInteger(questionsPerTurn) &&
    questionsPerTurn > 0
  );
};

// Config-load-time schema check for gameConfig.minigameRules.trivia.
export const isTriviaRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "questionsPerTurn" in value && isQuestionsPerTurn(value.questionsPerTurn);
};

export const resolveTriviaRules = (
  rules: SerializableValue | null
): TriviaRuntimeRules => {
  if (typeof rules !== "object" || rules === null) {
    return {
      questionsPerTurn: DEFAULT_TRIVIA_QUESTIONS_PER_TURN
    };
  }

  const parsedRules = rules as Partial<TriviaRuntimeRules>;

  return {
    questionsPerTurn: isQuestionsPerTurn(parsedRules.questionsPerTurn)
      ? parsedRules.questionsPerTurn
      : DEFAULT_TRIVIA_QUESTIONS_PER_TURN
  };
};
