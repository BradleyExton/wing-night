export const finalResultsStageCopy = {
  title: "Final Results",
  subtitle: "Winner is locked in. Celebrate and reset when ready.",
  winnerLabel: "Champion",
  noWinnerLabel: "No winner yet",
  scoreLabel: (score: number): string => `${score} pts`,
  teamsCompetedLabel: (teamCount: number): string =>
    `${teamCount} team${teamCount === 1 ? "" : "s"} competed`
} as const;
