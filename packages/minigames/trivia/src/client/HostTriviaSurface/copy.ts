export const hostTriviaSurfaceCopy = {
  introDescription: "Review the active team, then advance to begin trivia play.",
  playDescription: "Mark the active team's answer as correct or incorrect.",
  activeTeamMetaLabel: "Active Team",
  activeTeamLabel: (teamName: string): string => `Active Team: ${teamName}`,
  noAssignedTeamLabel: "No assigned team",
  questionLabel: "Question",
  answerLabel: "Answer",
  correctButtonLabel: "Correct",
  incorrectButtonLabel: "Incorrect"
} as const;
