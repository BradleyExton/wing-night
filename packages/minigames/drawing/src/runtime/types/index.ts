import type {
  DrawingContentFile,
  DrawingPromptReveal,
  DrawingStroke
} from "@wingnight/shared";

export type DrawingRuntimeContent = DrawingContentFile;

export type DrawingRuntimeState = {
  activeTurnTeamId: string | null;
  promptCursor: number;
  shuffledPromptIds: string[];
  pendingPointsByTeamId: Record<string, number>;
  strokes: DrawingStroke[];
  activeStrokeId: string | null;
  reveal: DrawingPromptReveal | null;
};

// What one team's turn hands the next in the same round: the deck, and how far
// into it the room has seen. Without it each team reshuffled the whole bank and
// could draw a prompt the room had just watched another team guess.
export type DrawingRoundMemory = {
  shuffledPromptIds: string[];
  promptCursor: number;
};

export type DrawingRuntimeRules = {
  // What each drawing the team guesses is worth.
  pointsPerCorrect: number;
};

export const DEFAULT_DRAWING_RULES: DrawingRuntimeRules = {
  pointsPerCorrect: 1
};

export const PROMPT_REVEAL_MS = 2000;

export const MAX_STROKES = 60;

export const MAX_POINTS_PER_STROKE = 500;

export const MAX_APPEND_POINTS_PER_ACTION = 64;
