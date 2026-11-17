import type { BrawlCrewWalk } from "@wingnight/shared";

/** How far the thumb travels from where it landed before it counts as a direction, in CSS px. */
export const STICK_DEAD_PX = 12;

/** The ring drawn round where the thumb landed; a thumb past it drags the centre along behind. */
export const STICK_RADIUS_PX = 56;

/** tan 67.5°: past this ratio of one axis to the other the thumb is on that axis, not a diagonal. */
const AXIS_RATIO = 2.414;

/**
 * The thumb's offset from the stick's centre as one of eight directions, or standing inside the
 * dead zone (docs/minigames/brawl-crew-spec.md §0.3). `dy` grows down the screen, which is toward
 * the camera: down is 3, up is 7.
 */
export const resolveStickDir = (dx: number, dy: number): BrawlCrewWalk => {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  if (ax * ax + ay * ay < STICK_DEAD_PX * STICK_DEAD_PX) {
    return 0;
  }

  if (ax > ay * AXIS_RATIO) {
    return dx > 0 ? 1 : 5;
  }

  if (ay > ax * AXIS_RATIO) {
    return dy > 0 ? 3 : 7;
  }

  if (dx > 0) {
    return dy > 0 ? 2 : 8;
  }

  return dy > 0 ? 4 : 6;
};

/**
 * Where the stick's centre is once the thumb is at `(x, y)`: where it was, unless the thumb has
 * outrun the ring, in which case the centre is dragged along a radius behind it — so turning back
 * is always one radius away however far the thumb has wandered.
 */
export const resolveStickCentre = (
  centre: { x: number; y: number },
  x: number,
  y: number
): { x: number; y: number } => {
  const dx = x - centre.x;
  const dy = y - centre.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= STICK_RADIUS_PX) {
    return { x: centre.x, y: centre.y };
  }

  const overshoot = (distance - STICK_RADIUS_PX) / distance;

  return { x: centre.x + dx * overshoot, y: centre.y + dy * overshoot };
};
