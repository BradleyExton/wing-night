export const hostDrawingSurfaceCopy = {
  railTitle: "Sketch Booth",
  teamPrefix: "On the easel:",
  noAssignedTeamLabel: "No team assigned",
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Pick an artist to hold the tablet. When the round starts, draw the prompt while your team shouts guesses — no letters, no numbers.",
  waitingPromptLabel: "No drawing prompts are loaded. Check minigames/drawing.json.",
  promptCardLabel: "★ Tonight's Prompt ★",
  inkSwatchLabel: (inkName: string): string => `${inkName} ink`,
  undoButtonLabel: "↶ Undo",
  clearButtonLabel: "⌫ Clear",
  skipButtonLabel: "Skip →",
  correctButtonLabel: "Correct",
  correctButtonSub: "+1 point",
  incorrectButtonLabel: "Nope",
  incorrectButtonSub: "no points",
  revealLine: (promptText: string, isCorrect: boolean): string =>
    isCorrect ? `“${promptText}” — got it!` : `“${promptText}” — missed it`
} as const;
