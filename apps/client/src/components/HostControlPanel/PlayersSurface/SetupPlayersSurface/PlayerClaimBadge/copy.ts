export const playerClaimBadgeCopy = {
  connected: "Phone in",
  asleep: "Asleep",
  release: "Free",
  releaseLabel: (name: string): string => `Free ${name}'s face from their phone`,
  statusLabel: (name: string, isConnected: boolean): string =>
    isConnected ? `${name} is on a phone` : `${name}'s phone is asleep`
} as const;
