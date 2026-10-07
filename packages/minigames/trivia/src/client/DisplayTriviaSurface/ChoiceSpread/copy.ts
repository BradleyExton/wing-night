export const choiceSpreadCopy = {
  letter: (index: number): string => String.fromCharCode(65 + index),
  // The right one says so in words and a ✓, not by colour alone (DESIGN.md §2.2E).
  answerTag: "✓ The answer",
  count: (count: number): string => `${count}`,
  kicker: (correct: number, seated: number): string =>
    correct === 0 ? `Nope — 0 of ${seated} got it` : `${correct} of ${seated} got it`,
  pointsValue: (points: number): string => `+${points}`,
  pointsCaption: "Points"
} as const;
