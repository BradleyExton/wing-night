export const displayDrawingSurfaceCopy = {
  marqueeTitle: "★ Live Sketch ★",
  pendingChip: (points: number): string => `+${points} pending`,
  introMessage:
    "Artists, limber up. The canvas goes live when the round starts.",
  drawingStatus: (teamName: string): string => `${teamName} is drawing…`,
  revealAnswerLabel: "The answer was",
  revealAwardPoints: "+1"
} as const;
