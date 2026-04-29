export const roundResultsStageCopy = {
  eyebrow: "Scores locked",
  headingPrefix: "Round",
  headingSuffix: "Done",
  fallbackRoundNumber: "—",
  formatRoundNumber: (roundNumber: number): string =>
    String(roundNumber).padStart(2, "0"),
  teamColumnLabel: "Team",
  wingsColumnLabel: "Wings",
  gameColumnLabel: "Game",
  thisRoundColumnLabel: "+ This Round",
  formatPointsDelta: (points: number): string => `+${points}`,
  emptyLabel: "No teams to display."
} as const;
