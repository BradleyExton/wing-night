export const hostRecreateSurfaceCopy = {
  targetLabel: (current: number, total: number): string => `Target ${current} of ${total}`,
  introDescription:
    "The TV shows a doctored party photo. The team writes the prompt they think made it, then you grade that prompt against its secret ingredient list.",
  waitingTargetLabel: "No target loaded. Check minigames/recreate.json.",
  originalCaption: "The original",
  targetCaption: "The target",
  attemptCaption: "The forgery",
  attemptGeneratingLabel: "The forger is painting…",
  attemptFailedLabel: (reason: string): string => `The forger bailed: ${reason}`,
  attemptSkippedLabel: "Live generation is off. Judge the prompt by ear.",
  attemptReadyLabel: "Forgery delivered.",
  composerLabel: "Describe the target in one prompt",
  composerPlaceholder:
    "e.g. Everyone floating in space in silver suits, the Earth behind them, a pizza drifting past",
  composerCounter: (remaining: number): string => `${remaining} characters left`,
  submitButtonLabel: "Send to the forger",
  readAloudLabel: "Their prompt. Read it aloud.",
  checklistLabel: "Secret ingredients. Tick what they named.",
  tallyLabel: (points: number): string => `+${points} pts on the table`,
  lockButtonLabel: "Lock in the score",
  retryButtonLabel: "Let them rewrite",
  pointsSealValue: (points: number): string => `+${points}`,
  pointsSealLabel: "pts",
  authoredPromptLabel: "The real prompt was",
  nextTargetButtonLabel: "Next target",
  turnCompleteLabel: "This team's targets are spent. Advance when ready."
} as const;
