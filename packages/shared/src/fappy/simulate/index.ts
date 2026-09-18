import type { FappyFrame, FappyGate, FappyLegCourse, FappyLegRun } from "../types.js";
import { FAPPY_WORLD, resolveFappyGates, resolveFappyLegTickCap } from "../world/index.js";

/** The frame every leg starts from: hovering at rest, nothing scrolled, nothing cleared. */
export const createFappyLegStart = (): FappyFrame => {
  return {
    tick: 0,
    bird: { y: FAPPY_WORLD.restY, vy: 0 },
    scrollX: 0,
    gatesCleared: 0,
    outcome: null
  };
};

const overlapsGateColumn = (gateScreenX: number, birdY: number, gate: FappyGate): boolean => {
  const { birdX, birdRadius, gateWidth } = FAPPY_WORLD;
  const isInColumn =
    birdX + birdRadius > gateScreenX && birdX - birdRadius < gateScreenX + gateWidth;

  if (!isInColumn) {
    return false;
  }

  return birdY - birdRadius < gate.gapTop || birdY + birdRadius > gate.gapBottom;
};

/**
 * The whole physics, one tick. A terminal frame steps to itself, so callers can advance past
 * the outcome without guarding. A flap sets the vertical velocity; gravity accumulates to a
 * terminal fall; the ceiling stops the bird, the floor and a champ kill it.
 */
export const stepFappy = (
  frame: FappyFrame,
  gates: readonly FappyGate[],
  gatesPerLeg: number,
  didFlap: boolean
): FappyFrame => {
  if (frame.outcome !== null) {
    return frame;
  }

  const { birdRadius, floorY, gravity, flapVelocity, maxFallVelocity, scrollSpeed, gateWidth, birdX } =
    FAPPY_WORLD;
  const vy = didFlap ? flapVelocity : Math.min(frame.bird.vy + gravity, maxFallVelocity);
  let y = frame.bird.y + vy;
  let nextVy = vy;
  const scrollX = frame.scrollX + scrollSpeed;
  const tick = frame.tick + 1;

  if (y - birdRadius < 0) {
    y = birdRadius;
    nextVy = 0;
  }

  if (y + birdRadius >= floorY) {
    return {
      tick,
      bird: { y: floorY - birdRadius, vy: nextVy },
      scrollX,
      gatesCleared: frame.gatesCleared,
      outcome: "crashed"
    };
  }

  let gatesCleared = 0;

  for (const gate of gates) {
    const gateScreenX = gate.x - scrollX;

    if (overlapsGateColumn(gateScreenX, y, gate)) {
      return {
        tick,
        bird: { y, vy: nextVy },
        scrollX,
        gatesCleared: frame.gatesCleared,
        outcome: "crashed"
      };
    }

    if (gateScreenX + gateWidth < birdX - birdRadius) {
      gatesCleared += 1;
    }
  }

  gatesCleared = Math.max(frame.gatesCleared, gatesCleared);

  return {
    tick,
    bird: { y, vy: nextVy },
    scrollX,
    gatesCleared,
    outcome: gatesCleared >= gatesPerLeg ? "cleared" : null
  };
};

/**
 * Steps `frame` up to `toTick`, flapping on every logged tick in `[frame.tick, toTick)`. A flap
 * logged at tick T applies to the step that produces T + 1 — the same rule the tablet used when
 * it logged the tap at its current tick. Ticks before the frame are already baked in and ignored;
 * a log that is not ascending simply flaps whenever a tick matches.
 */
export const advanceFappy = (
  frame: FappyFrame,
  gates: readonly FappyGate[],
  gatesPerLeg: number,
  flapTicks: readonly number[],
  toTick: number
): FappyFrame => {
  let current = frame;
  let flapCursor = 0;

  while (flapCursor < flapTicks.length && (flapTicks[flapCursor] ?? 0) < current.tick) {
    flapCursor += 1;
  }

  while (current.tick < toTick && current.outcome === null) {
    let didFlap = false;

    while (flapCursor < flapTicks.length && flapTicks[flapCursor] === current.tick) {
      didFlap = true;
      flapCursor += 1;
    }

    current = stepFappy(current, gates, gatesPerLeg, didFlap);
  }

  return current;
};

/** Runs a leg's log to its outcome. This is the referee: the server scores from nothing else. */
export const runFappyLeg = (course: FappyLegCourse, flapTicks: readonly number[]): FappyLegRun => {
  const gates = resolveFappyGates(course);
  const frame = advanceFappy(
    createFappyLegStart(),
    gates,
    course.gatesPerLeg,
    flapTicks,
    resolveFappyLegTickCap(course.gatesPerLeg)
  );

  return {
    outcome: frame.outcome ?? "flying",
    endTick: frame.tick,
    gatesCleared: frame.gatesCleared,
    frame
  };
};
