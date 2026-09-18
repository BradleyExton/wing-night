import type {
  SpotterCell,
  SpotterDirection,
  SpotterShotResult
} from "@wingnight/shared";

// Chebyshev distance in cells, inclusive: `{ maxCells: 0 }` is the cell itself,
// `{ maxCells: 1 }` the ring around it.
export type SpotterScoreBand = {
  maxCells: number;
  points: number;
};

export type SpotterRuntimeRules = {
  targetsPerTurn: number;
  gridCols: number;
  gridRows: number;
  scoreBandsCells: SpotterScoreBand[];
  // Optional fixed seed for deterministic fields (tests, the dev sandbox). A
  // real night rolls a fresh one per turn so a team scheduled twice sees two
  // different fields.
  seed: number | null;
};

export type SpotterRuntimeState = {
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
  seed: number;
  gridCols: number;
  gridRows: number;
  scoreBandsCells: SpotterScoreBand[];
  targets: SpotterCell[];
  targetIndex: number;
  cursor: SpotterCell;
  // Nudges since the last shot, oldest first — the TV's trail. Capped so a
  // panicked holder cannot grow the snapshot without bound.
  path: SpotterDirection[];
  results: SpotterShotResult[];
};

export const DEFAULT_SPOTTER_TARGETS_PER_TURN = 5;

export const DEFAULT_SPOTTER_GRID_COLS = 13;

export const DEFAULT_SPOTTER_GRID_ROWS = 7;

export const DEFAULT_SPOTTER_SCORE_BANDS_CELLS: SpotterScoreBand[] = [
  { maxCells: 0, points: 3 },
  { maxCells: 1, points: 1 }
];

export const MIN_SPOTTER_GRID_COLS = 5;

export const MAX_SPOTTER_GRID_COLS = 25;

export const MIN_SPOTTER_GRID_ROWS = 3;

export const MAX_SPOTTER_GRID_ROWS = 15;

export const MAX_SPOTTER_PATH_LENGTH = 40;

// Targets keep this much Chebyshev clearance from each other and from the
// starting cell, so no two shots are one nudge apart and the first target is
// never a free hit.
export const MIN_SPOTTER_TARGET_SPACING_CELLS = 2;
