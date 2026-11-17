import type { StickDir } from "../../yardSim";

// PROTOTYPE — throwaway. The crew pad's own stick, value for value
// (packages/minigames/brawl/src/client/CrewPad/resolveStick), copied because that package does
// not export it. The lab is only an honest test of the real pad if these numbers match it.

/** How far the thumb travels from where it landed before it counts as a direction, in CSS px. */
export const STICK_DEAD_PX = 12;

/** The ring drawn round where the thumb landed; a thumb past it drags the centre along behind. */
export const STICK_RADIUS_PX = 56;

/** tan 67.5°: past this ratio of one axis to the other the thumb is on that axis, not a diagonal. */
const AXIS_RATIO = 2.414;

/** The thumb's offset from the stick's centre as one of eight directions. `dy` grows down the screen. */
export const resolveStickDir = (dx: number, dy: number): StickDir => {
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

/** Where the stick's centre is once the thumb is at `(x, y)`: dragged a radius behind a thumb that outruns the ring. */
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
