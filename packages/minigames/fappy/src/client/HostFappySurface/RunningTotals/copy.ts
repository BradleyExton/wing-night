export const runningTotalsCopy = {
  title: "Round so far",
  points: (points: number): string => `${points} pt${points === 1 ? "" : "s"}`
} as const;
