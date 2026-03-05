export const turnResultsStageCopy = {
  title: "Team Turn Complete",
  summary: "Host is preparing the next turn. Round totals apply at round results.",
  activeTeamLabel: "Completed Team",
  noActiveTeamLabel: "No team recorded",
  turnProgressLabel: "Turn Progress",
  turnProgressValue: (completedTurnCount: number, totalTurnCount: number): string =>
    `${completedTurnCount}/${totalTurnCount} teams complete`,
  nextStepLabel: "Next Step",
  nextTeamStepValue: "Brief the next team",
  roundWrapStepValue: "Show round results"
} as const;
