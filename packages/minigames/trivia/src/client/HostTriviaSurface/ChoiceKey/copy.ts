export const choiceKeyCopy = {
  label: "Choices",
  letter: (index: number): string => String.fromCharCode(65 + index),
  answerMark: "✓"
} as const;
