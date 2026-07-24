import type { TriviaContentFile } from "@wingnight/shared";

export type TriviaRuntimeContent = TriviaContentFile;

export type TriviaRuntimeRules = {
  questionsPerTurn: number;
};

export type TriviaMinigameState = {
  turnOrderTeamIds: string[];
  activeTurnIndex: number;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
};

export type TriviaRuntimeState = {
  runtimeState: TriviaMinigameState;
  attemptsUsedThisTurn: number;
  questionsPerTurnLimit: number;
};

export const DEFAULT_TRIVIA_QUESTIONS_PER_TURN = 1;
