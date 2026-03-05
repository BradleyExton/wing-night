import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_TRIVIA_QUESTIONS_PER_TURN,
  type TriviaRuntimeRules
} from "../types/index.js";

const normalizeQuestionsPerTurn = (questionsPerTurn: unknown): number => {
  if (
    typeof questionsPerTurn !== "number" ||
    !Number.isInteger(questionsPerTurn) ||
    questionsPerTurn <= 0
  ) {
    return DEFAULT_TRIVIA_QUESTIONS_PER_TURN;
  }

  return questionsPerTurn;
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
    questionsPerTurn: normalizeQuestionsPerTurn(parsedRules.questionsPerTurn)
  };
};
