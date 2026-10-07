import type { TriviaChoiceReveal, TriviaContentFile } from "@wingnight/shared";

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
  // Each playing-team phone's own choice on the question in hand (an index into its `choices`),
  // by player. Secret until the host locks the question: no view but that player's own card
  // carries one before `reveal` exists.
  choicesByPlayerId: Record<string, number>;
  // The locked question's spread, from the host's `lockChoices` until the next question.
  reveal: TriviaChoiceReveal | null;
};

export const DEFAULT_TRIVIA_QUESTIONS_PER_TURN = 1;

// What one question is worth: a host's CORRECT banks one point, and so does a multiple-choice
// question the team's phones get right. The phones' share scales into it:
//
//   points = round(TRIVIA_POINTS_PER_QUESTION x correct / seated)
//
// where `seated` is the playing team's phones holding their faces at the lock that are awake (plus
// any asleep one that chose before it slept) and `correct` those of them that chose the answer —
// rounded half up. With one point a question this is a MAJORITY VOTE: half the counted phones
// right bank the point, fewer bank nothing. Partial credit would need a per-question value above
// one (BACKLOG.md). The lock waits for at least one answer — with none in, the host judges it aloud
// with CORRECT / INCORRECT. The turn's cap (`pointsMax`) still clips the total, as it always has.
export const TRIVIA_POINTS_PER_QUESTION = 1;

export const TRIVIA_CHOOSE_ANSWER_ACTION = "chooseAnswer";
export const TRIVIA_LOCK_CHOICES_ACTION = "lockChoices";
export const TRIVIA_NEXT_QUESTION_ACTION = "nextQuestion";
