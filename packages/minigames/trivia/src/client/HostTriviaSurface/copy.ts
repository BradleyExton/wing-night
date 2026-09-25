export const hostTriviaSurfaceCopy = {
  introDescription: "Review the active team, then advance to begin trivia play.",
  // No play-phase description: the rail says whose turn it is, the counter says
  // how much of it is left, and the card is the only thing on the canvas. A
  // sentence telling the host to score the answers was 90px of the 355px of
  // dead air this takeover was measured for.
  questionsLeftLabel: (count: number): string =>
    `${count} question${count === 1 ? "" : "s"} left`,
  questionLabel: "Question",
  answerLabel: "Answer",
  waitingPromptLabel: "Waiting for the next trivia prompt.",
  turnCompleteTitle: "Turn complete",
  turnCompleteHint:
    "That's the team's questions. Advance the phase when the room is ready.",
  correctButtonLabel: "Correct",
  correctIconGlyph: "✓",
  incorrectButtonLabel: "Incorrect",
  incorrectIconGlyph: "✗"
} as const;
