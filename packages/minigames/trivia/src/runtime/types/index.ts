import type { TriviaContentFile } from "@wingnight/shared";

import type { TriviaMinigameState } from "../../index.js";

export type TriviaRuntimeContent = TriviaContentFile;

export type TriviaRuntimeRules = {
  questionsPerTurn: number;
};

export type TriviaRuntimeState = {
  runtimeState: TriviaMinigameState;
  attemptsUsedThisTurn: number;
  questionsPerTurnLimit: number;
};

export const DEFAULT_TRIVIA_QUESTIONS_PER_TURN = 1;
