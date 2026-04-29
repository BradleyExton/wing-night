export const roundIntroStageCopy = {
  eyebrow: "Coming up",
  followedByLabel: "followed by",
  formatRoundNumber: (roundNumber: number): string =>
    String(roundNumber).padStart(2, "0")
} as const;
