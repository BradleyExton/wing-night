const COUNTDOWN_WORDS: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten"
} as const;

export const gameLockedOverlayCopy = {
  headingLead: "Locked",
  headingAccent: "In",
  readyLabel: "Host is ready to launch the round.",
  countdownPrefix: "Game starts in",
  formatCountdownNumber: (remainingSeconds: number): string =>
    String(remainingSeconds),
  formatCountdownWord: (remainingSeconds: number): string =>
    COUNTDOWN_WORDS[remainingSeconds] ?? String(remainingSeconds)
} as const;
