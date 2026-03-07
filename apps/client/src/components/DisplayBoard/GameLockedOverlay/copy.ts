export const gameLockedOverlayCopy = {
  brandLabel: "Wing Night",
  title: "Game Locked In",
  lockedDescription: "Host is ready to launch the round.",
  countdownDescription: "Round intro starts on the next beat.",
  countdownLabel: "Starting In",
  countLabel: (remainingSeconds: number): string => `${remainingSeconds}`
} as const;
