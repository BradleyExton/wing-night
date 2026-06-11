import type {
  GeoContentFile,
  GeoPromptResult,
  GeoScoreBand
} from "@wingnight/shared";

export type GeoRuntimeContent = GeoContentFile;

export type GeoRuntimeRules = {
  promptsPerTurn: number;
  scoreBandsKm: GeoScoreBand[];
};

export type GeoRuntimeSubState = "guessing" | "submitted";

export type GeoRuntimeGuess = {
  lat: number;
  lng: number;
};

export type GeoRuntimeState = {
  turnOrderTeamIds: string[];
  activeTurnIndex: number;
  promptCursor: number;
  promptsPerTurn: number;
  promptsCompletedThisTurn: number;
  currentGuess: GeoRuntimeGuess | null;
  currentSubState: GeoRuntimeSubState;
  lastResult: GeoPromptResult | null;
  pendingPointsByTeamId: Record<string, number>;
};

export const DEFAULT_GEO_PROMPTS_PER_TURN = 3;

export const DEFAULT_GEO_SCORE_BANDS_KM: GeoScoreBand[] = [
  { maxKm: 0.1, points: 5 },
  { maxKm: 0.5, points: 4 },
  { maxKm: 2, points: 3 },
  { maxKm: 10, points: 2 },
  { maxKm: 50, points: 1 }
];
