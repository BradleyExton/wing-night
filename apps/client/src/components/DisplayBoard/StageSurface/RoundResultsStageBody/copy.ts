export const roundResultsStageCopy = {
  title: "Round Scores Applied",
  summary: "Wing and mini-game points are now locked into total standings.",
  wingPointsLabel: "Wing Points",
  minigamePointsLabel: "Mini-Game Points",
  roundPointsLabel: "Round Total",
  pointsValue: (points: number): string => `+${points} pts`
} as const;
