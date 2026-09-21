export const relayClockCopy = {
  idle: "0:00.0",
  limit: (limitSeconds: number): string =>
    `/ ${Math.floor(limitSeconds / 60)}:${String(limitSeconds % 60).padStart(2, "0")}`
} as const;
