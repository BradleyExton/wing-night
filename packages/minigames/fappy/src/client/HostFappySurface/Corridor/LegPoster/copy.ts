export const legPosterCopy = {
  kicker: "You're up",
  name: (playerName: string | null): string => playerName ?? "The house hen",
  prompt: (isRespawn: boolean): string => (isRespawn ? "Tap to go again" : "Tap to fly")
} as const;
