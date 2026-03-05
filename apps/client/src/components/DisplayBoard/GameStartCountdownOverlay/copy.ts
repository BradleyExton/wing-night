export const gameStartCountdownOverlayCopy = {
  kickerLabel: "Game Starts In",
  countLabel: (remainingSeconds: number): string => `${remainingSeconds}`,
  roundIntroReadyLabel: "Round Intro Locked"
} as const;
