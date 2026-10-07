export const choiceKeyCopy = {
  label: "Choices",
  letter: (index: number): string => String.fromCharCode(65 + index),
  answerMark: "✓",
  // On the reveal, how many of the team's phones chose each one. A count, never who.
  count: (count: number): string => `${count}`
} as const;
