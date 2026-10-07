export const playerJoinCardCopy = {
  kicker: "Join on your phone",
  instruction: "Scan, then tap your face",
  formatJoinedCount: (claimed: number, total: number): string => `${claimed} of ${total} in`
} as const;
