import type { MountRuntimeClimb } from "../types/index.js";

// A skipped climb never had a result; every refereed climb counts what it reached.
export const resolveShareBanked = (climbs: readonly MountRuntimeClimb[]): number => {
  return climbs.reduce((total, climb) => total + (climb.result?.share ?? 0), 0);
};

/**
 * The turn's points: the shares against one full share a climb, rounded once at the end like
 * BRAWL's worth over total. Every climber mounting is full points and there is nothing above it;
 * near misses are built in, because a timeout banks how far it got.
 */
export const resolveMountPoints = (
  shareBanked: number,
  climbsPerTurn: number,
  pointsMax: number
): number => {
  const share = Math.min(1, Math.max(0, shareBanked / Math.max(1, climbsPerTurn)));

  return Math.max(0, Math.round(pointsMax * share));
};
