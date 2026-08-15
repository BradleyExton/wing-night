// The miss beat's choreography, shared by all three variants. AC#6 is explicit that the gag has to
// COMPLETE — "a second character walks on and picks it up" — so the beat runs walk-on → stoop →
// pick up → carry off, and the projectile stops being drawn on the floor once she has it.
const ARRIVED_AT = 0.45;
const PICKED_UP_AT = 0.6;

const clampProgress = (progress: number): number => {
  if (progress < 0) {
    return 0;
  }

  if (progress > 1) {
    return 1;
  }

  return progress;
};

const lerp = (from: number, to: number, t: number): number => {
  return from + (to - from) * t;
};

/**
 * Where the cleaner is along the floor. She enters from the right edge of the scene, stops beside
 * the projectile, and walks back off the same way once she has picked it up — so the beat ends on
 * an empty floor rather than on a character standing in the scene forever.
 */
export const resolveCleanerX = (
  progress: number,
  sceneWidth: number,
  restX: number
): number => {
  const t = clampProgress(progress);

  if (t <= ARRIVED_AT) {
    return lerp(sceneWidth, restX, t / ARRIVED_AT);
  }

  if (t < PICKED_UP_AT) {
    return restX;
  }

  return lerp(restX, sceneWidth, (t - PICKED_UP_AT) / (1 - PICKED_UP_AT));
};

export const isStooping = (progress: number): boolean => {
  const t = clampProgress(progress);

  return t >= ARRIVED_AT && t < PICKED_UP_AT;
};

export const hasPickedUp = (progress: number): boolean => {
  return clampProgress(progress) >= PICKED_UP_AT;
};
