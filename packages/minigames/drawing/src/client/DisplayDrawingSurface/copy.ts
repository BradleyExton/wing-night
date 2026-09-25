import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

export const displayDrawingSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.DRAWING.displayName,
  pendingChip: (points: number): string => `+${points} pending`,
  introMessage:
    "Artists, limber up. The canvas goes live when the round starts.",
  drawingStatus: (teamName: string): string => `${teamName} is drawing…`,
  revealAnswerLabel: "The answer was",
  // A miss names itself in words as well as in red (DESIGN.md §7).
  revealMissedLabel: "Nope — the answer was",
  revealAwardPoints: "+1",
  revealSparkGlyphPrimary: "✦",
  revealSparkGlyphSecondary: "✧"
} as const;
