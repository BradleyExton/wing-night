export const finalResultsStageCopy = {
  gameOverLabel: "Game Over",
  championLabel: "Champion",
  tieLabel: "It's a Tie",
  tieHintLabel: "Sudden death decides the champion",
  tieNameJoiner: " & ",
  noWinnerLabel: "No winner yet",
  pointsUnitLabel: "pts",
  bestBettorLabel: "Best bettor",
  bestBettorNames: (names: string[]): string => names.join(" & "),
  bestBettorRecord: (won: number, played: number): string => `· ${won} of ${played} called`
} as const;
