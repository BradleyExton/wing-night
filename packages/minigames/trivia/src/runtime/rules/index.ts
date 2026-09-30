import { isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_TRIVIA_QUESTIONS_PER_TURN,
  type TriviaRuntimeRules
} from "../types/index.js";

// Config-load-time schema check for gameConfig.minigameRules.trivia.
export const isTriviaRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return isPositiveInteger(value.questionsPerTurn);
};

export const resolveTriviaRules = (
  rules: SerializableValue | null
): TriviaRuntimeRules => {
  if (!isRecord(rules)) {
    return {
      questionsPerTurn: DEFAULT_TRIVIA_QUESTIONS_PER_TURN
    };
  }

  const parsedRules = rules as Partial<TriviaRuntimeRules>;

  return {
    questionsPerTurn: isPositiveInteger(parsedRules.questionsPerTurn)
      ? parsedRules.questionsPerTurn
      : DEFAULT_TRIVIA_QUESTIONS_PER_TURN
  };
};
