import type { SpotterCell, SpotterDirection } from "@wingnight/shared";

const INVERSE_DIRECTION: Record<SpotterDirection, SpotterDirection> = {
  U: "D",
  D: "U",
  L: "R",
  R: "L"
};

const step = (cell: SpotterCell, direction: SpotterDirection): SpotterCell => {
  if (direction === "U") {
    return { col: cell.col, row: cell.row - 1 };
  }

  if (direction === "D") {
    return { col: cell.col, row: cell.row + 1 };
  }

  if (direction === "L") {
    return { col: cell.col - 1, row: cell.row };
  }

  return { col: cell.col + 1, row: cell.row };
};

// Rebuilds the cells the crosshair passed through since the last shot by
// walking the trail backwards from where it is now. Exact, because the
// runtime never records a nudge that hit a wall.
export const resolveTrailCells = (
  cursor: SpotterCell,
  path: SpotterDirection[]
): SpotterCell[] => {
  const cells: SpotterCell[] = [cursor];
  let current = cursor;

  for (let index = path.length - 1; index >= 0; index -= 1) {
    current = step(current, INVERSE_DIRECTION[path[index] as SpotterDirection]);
    cells.unshift(current);
  }

  return cells;
};
