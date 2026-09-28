import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

export const hostDrawingSurfaceCopy = {
  // The booth's own sign. It used to be the title of a mini-rail this surface
  // drew for itself; the rail is the shell's now, so the name went onto the
  // furniture — the head of the ink palette, which is the one column on this
  // surface that costs the board nothing. It reads the game's one name: the
  // plate said "Sketch Booth" for a while, which made DRAWING the only game
  // with a second title on the tablet.
  boothTitle: MINIGAME_DEFINITIONS.DRAWING.displayName,
  introDescription:
    "Pick an artist to hold the tablet. When the round starts, draw the prompt while your team shouts guesses — no letters, no numbers.",
  waitingPromptLabel: "No drawing prompts are loaded. Check minigames/drawing.json.",
  waitingBoardLabel: "The easel has not loaded. Check the round's DRAWING rules.",
  promptCardLabel: "★ Tonight's Prompt ★",
  pendingChip: (points: number): string => `+${points} pending`,
  inkSwatchLabel: (inkName: string): string => `${inkName} ink`,
  undoButtonLabel: "↶ Undo",
  clearButtonLabel: "⌫ Clear",
  skipButtonLabel: "Skip →",
  correctButtonLabel: "Correct",
  incorrectButtonLabel: "Nope",
  correctIconGlyph: "✓",
  incorrectIconGlyph: "✗",
  revealLine: (promptText: string, isCorrect: boolean): string =>
    isCorrect ? `“${promptText}” — got it!` : `“${promptText}” — missed it`
} as const;
