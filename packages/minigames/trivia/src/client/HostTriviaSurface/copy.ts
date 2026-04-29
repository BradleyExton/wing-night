export const hostTriviaSurfaceCopy = {
  introDescription: "Review the active team, then advance to begin trivia play.",
  playDescription: "Run the team's trivia turn and score each answer as it comes in.",
  activeTeamMetaLabel: "Team Up",
  activeTeamLabel: (teamName: string): string => `Active Team: ${teamName}`,
  questionsLeftMetaLabel: "Questions Left",
  questionsLeftLabel: (count: number): string =>
    `${count} question${count === 1 ? "" : "s"} left`,
  noAssignedTeamLabel: "No assigned team",
  questionLabel: "Question",
  answerLabel: "Answer",
  waitingPromptLabel: "Waiting for the next trivia prompt.",
  turnCompleteLabel: "This team has finished all trivia questions. Advance when ready.",
  correctButtonLabel: "Correct",
  incorrectButtonLabel: "Incorrect"
} as const;
