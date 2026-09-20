import type { SchlonicRuntimeRun } from "../types/index.js";

// Only a run that reached the post brings anything home; the referee has already zeroed the
// others, but a skipped run never had a result at all.
export const resolveRingsBanked = (runs: readonly SchlonicRuntimeRun[]): number => {
  return runs.reduce((total, run) => total + (run.result?.rings ?? 0), 0);
};

export const resolveRingsPar = (parRingsPerRun: number, runsPerTurn: number): number => {
  return Math.max(1, parRingsPerRun * runsPerTurn);
};

/**
 * Rings are the whole currency: what the team carried over the post against what a team that
 * took the high line all the way would have. Par is full points and there is nothing above it —
 * a zone is only worth so much, and a team that has already maxed it should be handing the
 * tablet on rather than farming the last chunk.
 */
export const resolveSchlonicPoints = (
  ringsBanked: number,
  ringsPar: number,
  pointsMax: number
): number => {
  const share = Math.min(1, Math.max(0, ringsBanked / Math.max(1, ringsPar)));

  return Math.max(0, Math.round(pointsMax * share));
};
