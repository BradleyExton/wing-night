// The miss beat's choreography. The gag has to COMPLETE — walk on, stoop, pick
// up, carry off — so the beat ends on an empty floor rather than a character
// standing in the scene forever. Ported from the retired UI direction lab.
const ARRIVED_AT = 0.45;

const PICKED_UP_AT = 0.6;

const clampProgress = (progress: number): number => {
  return Math.min(1, Math.max(0, progress));
};

const lerp = (from: number, to: number, t: number): number => {
  return from + (to - from) * t;
};

// Where the cleaner is along the floor: in from the scene's right edge, a stop
// beside the wing, and back out the same way once she has it.
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
