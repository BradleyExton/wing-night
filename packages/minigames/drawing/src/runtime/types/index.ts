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

export const PROMPT_REVEAL_MS = 2000;

export const MAX_STROKES = 60;

export const MAX_POINTS_PER_STROKE = 500;

export const MAX_APPEND_POINTS_PER_ACTION = 64;
