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

// What one question is worth: the host's CORRECT banks it, INCORRECT banks nothing. The turn's cap
// (`pointsMax`) still clips the total.
export const TRIVIA_POINTS_PER_QUESTION = 1;
