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

// The slide, read backwards: the SLOWEST finish that still pays one point more
// than `rivalPoints`. The room cannot do this sum in its head — the curve is a
// share of a max over a window between two configured seconds — so the number
// that actually matters to a team mid-relay ("how long have we got?") was the
// one thing neither screen could say.
//
// `resolveFinishPoints` rounds, so a time pays `target` for as long as its
// unrounded share reaches `target - 0.5`; invert from there and floor, because
// the next millisecond is the first that does not. Null when there is nothing
// to chase: beating a rival who already has the round's max would take a time
// better than par, and par is where the curve stops paying more.
export const resolveTimeToBeat = (
  rivalPoints: number,
  rules: ScoringRules,
  pointsMax: number
): number | null => {
  const target = rivalPoints + 1;

  if (pointsMax <= 0 || target > pointsMax) {
    return null;
  }

  const parMs = rules.parSeconds * 1000;
  const limitMs = rules.limitSeconds * 1000;
  const share = (target - 0.5) / pointsMax;
  const overrun = (1 - share) / (1 - FAPPY_LIMIT_POINTS_SHARE);

  if (overrun >= 1) {
    return limitMs;
  }

  const closedForm = Math.min(limitMs, Math.max(parMs, Math.floor(parMs + overrun * Math.max(1, limitMs - parMs))));

  // The closed form lands on a rounding boundary — `target - 0.5` is exactly
  // where `Math.round` tips — and binary floating point decides which side by
  // the last bit, so the answer can be one millisecond out either way. Walking
  // the last step against `resolveFinishPoints` itself makes the two agree by
  // construction rather than by the arithmetic happening to match; it is never
  // more than a millisecond or two, so the walk is bounded and cheap.
  let timeToBeatMs = closedForm;

  while (timeToBeatMs > parMs && resolveFinishPoints(timeToBeatMs, rules, pointsMax) < target) {
    timeToBeatMs -= 1;
  }

  while (
    timeToBeatMs < limitMs &&
    resolveFinishPoints(timeToBeatMs + 1, rules, pointsMax) >= target
  ) {
    timeToBeatMs += 1;
  }

  return timeToBeatMs;
};
