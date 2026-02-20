export const hostTriviaSurfaceCopy = {
  introDescription: "Review the active team, then advance to begin trivia play.",
  playDescription: "Mark the active team's answer as correct or incorrect.",
  activeTeamLabel: (teamName: string): string => `Active Team: ${teamName}`,
  questionLabel: "Question",
  answerLabel: "Answer",
  correctButtonLabel: "Correct",
  incorrectButtonLabel: "Incorrect"
} as const;
