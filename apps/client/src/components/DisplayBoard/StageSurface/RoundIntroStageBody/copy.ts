export const roundIntroStageCopy = {
  phaseEyebrow: "Round Intro",
  headline: (roundNumber: number, roundLabel: string): string =>
    `Round ${roundNumber}: ${roundLabel}`,
  summary: "Sauce is locked. Mini-game is up next.",
  sauceLabel: "Sauce",
  minigameLabel: "Mini-Game",
  heroIllustrationPath: "/display/setup/flow-round-intro.png",
  heroIllustrationAlt: "Round intro hero illustration"
} as const;
