import type {
  RecreateAttempt,
  RecreateContentFile,
  RecreateSubState
} from "@wingnight/shared";

export type RecreateRuntimeContent = RecreateContentFile;

export type RecreateRuntimeRules = {
  // Targets each team gets in one turn.
  targetsPerTurn: number;
  // What every ingredient the team's prompt names is worth.
  pointsPerIngredient: number;
  // Off means the prompt is judged as read aloud and no image is generated —
  // the sandbox runs this way, and so can a party with no key or no signal.
  liveGeneration: boolean;
};

export type RecreateRuntimeState = {
  turnOrderTeamIds: string[];
  activeTurnIndex: number;
  promptCursor: number;
  targetsPerTurn: number;
  targetsCompletedThisTurn: number;
  pointsPerIngredient: number;
  liveGeneration: boolean;
  subState: RecreateSubState;
  attempt: RecreateAttempt | null;
  // Counts submissions this turn, so a retried prompt gets a new attempt id
  // and a late result for the abandoned one is ignored.
  attemptSequence: number;
  checkedIngredientIndexes: number[];
  lastPointsAwarded: number | null;
  pendingPointsByTeamId: Record<string, number>;
};

export const DEFAULT_RECREATE_RULES: RecreateRuntimeRules = {
  targetsPerTurn: 1,
  pointsPerIngredient: 1,
  liveGeneration: true
};

// Long enough for a paragraph, short enough that a team cannot paste the
// dictionary in and hit every ingredient by accident.
export const RECREATE_MAX_PROMPT_LENGTH = 400;
