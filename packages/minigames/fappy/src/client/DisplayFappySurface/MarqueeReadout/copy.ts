export const marqueeReadoutCopy = {
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  gatesCounter: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} / ${gatesTotal} gates`,
  clockIdle: "0:00.0",
  // What a finish RIGHT NOW would pay. Same shape as the finished plaque's
  // number on purpose: the room is watching one figure stop being a promise.
  livePoints: (points: number): string => `+${points}`,
  parHint: (parClock: string): string => `par ${parClock}`,
  // The TV has no team-name lookup in its renderer props — only the ACTIVE
  // team's name — so the wall names the target and the tablet names the rival.
  timeToBeat: (clock: string): string => `Beat ${clock} to take the lead`,
  beatPar: "Beat par to take the lead"
} as const;
