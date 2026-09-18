export const fieldLayerCopy = {
  pickupLabel: (points: number): string => `+${points}`,
  cellLabel: (column: number, row: number): string => `Cell ${column + 1}, ${row + 1}`
} as const;
