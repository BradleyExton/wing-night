export const pointsMeterCopy = {
  livePoints: (points: number): string => `+${points}`,
  parHint: (parClock: string): string => `par ${parClock}`
} as const;
