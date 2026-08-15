import type { BeatId } from "../../sequence";

export type Point = { x: number; y: number };

/**
 * The four places a run's projectile is ever anchored to. Each variant supplies its own set in its
 * own viewBox coordinates, which is how one flight model serves three structurally different
 * compositions.
 */
export type FlightWaypoints = {
  /** In the thrower's hand, before release. */
  hand: Point;
  /** Where the arc meets the team's ramp and is deflected. */
  deflect: Point;
  /** Resting inside the trash can — the landed ending. */
  can: Point;
  /** Resting on the floor — the missed ending. */
  floor: Point;
};

export type RunOutcome = "landed" | "missed";

/** Quadratic bezier, so a throw arcs instead of travelling in a straight line. */
const arc = (from: Point, to: Point, apexLift: number, t: number): Point => {
  const control: Point = {
    x: (from.x + to.x) / 2,
    y: Math.min(from.y, to.y) - apexLift
  };
  const inverse = 1 - t;

  return {
    x: inverse * inverse * from.x + 2 * inverse * t * control.x + t * t * to.x,
    y: inverse * inverse * from.y + 2 * inverse * t * control.y + t * t * to.y
  };
};

const clampProgress = (progress: number): number => {
  if (progress < 0) {
    return 0;
  }

  if (progress > 1) {
    return 1;
  }

  return progress;
};

/**
 * Where the projectile sits for a given beat. It stays in the hand through EATING and release, arcs
 * to the ramp during the first half of flight, is deflected toward its ending in the second half,
 * and holds still once it has settled — including through the cleanup beat, where the cleaner comes
 * to it rather than it moving on its own.
 */
export const resolveProjectilePoint = (
  beatId: BeatId,
  progress: number,
  outcome: RunOutcome,
  waypoints: FlightWaypoints
): Point => {
  const t = clampProgress(progress);
  const ending = outcome === "landed" ? waypoints.can : waypoints.floor;

  if (beatId === "eating" || beatId === "release") {
    return waypoints.hand;
  }

  if (beatId === "flight") {
    if (t < 0.5) {
      return arc(waypoints.hand, waypoints.deflect, 90, t / 0.5);
    }

    return arc(waypoints.deflect, ending, 40, (t - 0.5) / 0.5);
  }

  return ending;
};

/**
 * Whether the projectile has been let go yet — the thrower's hand is drawn empty from here on, and
 * the release beat is what AC#7's hand-off out of EATING resolves into.
 */
export const hasReleased = (beatId: BeatId): boolean => {
  return beatId !== "eating";
};
