import type { SpotterCell, SpotterDirection } from "@wingnight/shared";

import { MIN_SPOTTER_TARGET_SPACING_CELLS } from "../types/index.js";

// mulberry32: a tiny seeded PRNG so a fixed seed yields a fixed field. Only
// the server runs it — targets are stored in state and projected, never
// re-derived on a client.
const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

export const chebyshevDistance = (left: SpotterCell, right: SpotterCell): number => {
  return Math.max(Math.abs(left.col - right.col), Math.abs(left.row - right.row));
};

export const resolveStartCell = (gridCols: number, gridRows: number): SpotterCell => {
  return { col: Math.floor(gridCols / 2), row: Math.floor(gridRows / 2) };
};

const PLACEMENT_ATTEMPTS_PER_SPACING = 200;

type GenerateTargetsInput = {
  seed: number;
  gridCols: number;
  gridRows: number;
  targetCount: number;
};

// Scatters targets with a minimum clearance from each other and from the
// start cell; if a tight grid cannot honour the clearance the spacing relaxes
// one cell at a time rather than looping forever or returning short.
export const generateSpotterTargets = ({
  seed,
  gridCols,
  gridRows,
  targetCount
}: GenerateTargetsInput): SpotterCell[] => {
  const random = createSeededRandom(seed);
  const startCell = resolveStartCell(gridCols, gridRows);
  const targets: SpotterCell[] = [];
  const cellCount = gridCols * gridRows;
  const maxTargets = Math.min(targetCount, cellCount - 1);

  while (targets.length < maxTargets) {
    let placed = false;

    for (
      let spacing = MIN_SPOTTER_TARGET_SPACING_CELLS;
      spacing >= 1 && !placed;
      spacing -= 1
    ) {
      for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS_PER_SPACING; attempt += 1) {
        const candidate: SpotterCell = {
          col: Math.floor(random() * gridCols),
          row: Math.floor(random() * gridRows)
        };

        if (chebyshevDistance(candidate, startCell) < spacing) {
          continue;
        }

        if (targets.some((target) => chebyshevDistance(target, candidate) < spacing)) {
          continue;
        }

        targets.push(candidate);
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Spacing 1 with 200 attempts failing means the grid is essentially
      // full; take the first free non-start cell in scan order.
      const fallback = findFirstFreeCell(gridCols, gridRows, [startCell, ...targets]);

      if (fallback === null) {
        break;
      }

      targets.push(fallback);
    }
  }

  return targets;
};

const findFirstFreeCell = (
  gridCols: number,
  gridRows: number,
  occupied: SpotterCell[]
): SpotterCell | null => {
  for (let row = 0; row < gridRows; row += 1) {
    for (let col = 0; col < gridCols; col += 1) {
      if (!occupied.some((cell) => cell.col === col && cell.row === row)) {
        return { col, row };
      }
    }
  }

  return null;
};

export const applyDirection = (
  cell: SpotterCell,
  direction: SpotterDirection,
  gridCols: number,
  gridRows: number
): SpotterCell => {
  const next = { ...cell };

  if (direction === "U") {
    next.row = Math.max(0, cell.row - 1);
  } else if (direction === "D") {
    next.row = Math.min(gridRows - 1, cell.row + 1);
  } else if (direction === "L") {
    next.col = Math.max(0, cell.col - 1);
  } else {
    next.col = Math.min(gridCols - 1, cell.col + 1);
  }

  return next;
};

export const rollSpotterSeed = (): number => {
  return Math.floor(Math.random() * 0x7fffffff);
};
