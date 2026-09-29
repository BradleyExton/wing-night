import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicGroundY } from "@wingnight/shared";

/**
 * How far off the surface the feet have to be before the rider is in the air as far as the
 * picture and the sound are concerned. The sim has no ground-stick: a board rolling down a
 * slope steeper than it can fall leaves the sidewalk for a few ticks and touches down again —
 * `grounded` flickers all the way down a hill, a unit or two off the paving at most (about 3
 * off the steepest drop at full speed). None of that is air to the room, so nothing the room
 * sees or hears may hang off `grounded` alone. A real ollie is past this in its second tick.
 */
export const AIR_CLEARANCE = 3;

/** The surface the runner would come down on at `x`, from feet at `feetY`: a rail's top it is over, or the ground. */
const resolveSurfaceY = (zone: SchlonicZone, x: number, feetY: number): number => {
  let surface = resolveSchlonicGroundY(zone, x);

  for (const prop of zone.props) {
    if (prop.kind !== "rail" || prop.toX === undefined || x < prop.x || x > prop.toX) {
      continue;
    }

    // Only a rail the feet are at or over; a bird under a rail stands on the street.
    if (prop.y >= feetY - 0.001 && prop.y < surface) {
      surface = prop.y;
    }
  }

  return surface;
};

/**
 * World units between the runner's feet and what is under them — the rail it is over, or the
 * ground. Over a trench the ground is the trench's floor, so the number is huge, and it is: that
 * is air.
 */
export const resolveRunnerClearance = (zone: SchlonicZone, frame: SchlonicFrame): number => {
  if (frame.grounded) {
    return 0;
  }

  const feetY = frame.y + SCHLONIC_WORLD.runnerRadius;

  return Math.max(0, resolveSurfaceY(zone, frame.x, feetY) - feetY);
};

/** In the air, as the room would say it: off the ground and clear of it (`AIR_CLEARANCE`). */
export const isRunnerAirborne = (zone: SchlonicZone, frame: SchlonicFrame): boolean => {
  return resolveRunnerClearance(zone, frame) > AIR_CLEARANCE;
};
