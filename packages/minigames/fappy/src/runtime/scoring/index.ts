import { FAPPY_LIMIT_POINTS_SHARE, type FappyRuntimeRules } from "../types/index.js";

type ScoringRules = Pick<FappyRuntimeRules, "parSeconds" | "limitSeconds">;

// The faster the relay, the more it scores: every point at or under par,
// sliding straight down to the limit share at the limit. Time is the only
// currency — a crash costs seconds, never points directly.
export const resolveFinishPoints = (
  elapsedMs: number,
  rules: ScoringRules,
  pointsMax: number
): number => {
  const parMs = rules.parSeconds * 1000;
  const limitMs = rules.limitSeconds * 1000;

  if (elapsedMs <= parMs) {
    return pointsMax;
  }

  const overrun = Math.min(1, (elapsedMs - parMs) / Math.max(1, limitMs - parMs));
  const share = 1 - (1 - FAPPY_LIMIT_POINTS_SHARE) * overrun;

  return Math.max(0, Math.round(pointsMax * share));
};

// A team the limit caught keeps the limit share, scaled by how much of the
// course it got through, so a near miss is not a zero.
export const resolveTimeoutPoints = (
  gatesCleared: number,
  gatesTotal: number,
  pointsMax: number
): number => {
  if (gatesTotal <= 0) {
    return 0;
  }

  const progress = Math.min(1, Math.max(0, gatesCleared / gatesTotal));

  return Math.max(0, Math.round(pointsMax * FAPPY_LIMIT_POINTS_SHARE * progress));
};
