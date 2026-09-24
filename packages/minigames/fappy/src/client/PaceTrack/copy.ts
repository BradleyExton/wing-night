export const paceTrackCopy = {
  // The strip is a picture; this is the same fact in words, for a screen
  // reader and for the e2e suite's benefit.
  label: (gatesCleared: number, gatesTotal: number, clock: string, parClock: string): string =>
    `Pace: ${gatesCleared} of ${gatesTotal} gates at ${clock} against a ${parClock} par`,
  limitTick: (limitClock: string): string => limitClock
} as const;
