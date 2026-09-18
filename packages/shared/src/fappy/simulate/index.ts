import type { FappyFrame, FappyGate, FappyLegCourse, FappyLegRun } from "../types.js";
import {
  FAPPY_WORLD,
  resolveFappyChampTop,
  resolveFappyGates,
  resolveFappyLegTickCap,
  resolveFappyPerchY
} from "../world/index.js";

/**
 * The frame a leg (or an attempt at it) starts from. From the start line the bird hovers at rest
 * with nothing scrolled; from a checkpoint it sits on the perch of the last gate it cleared,
 * that gate just behind it, with its count intact. A checkpoint past the course clamps to the
 * last gate.
 */
export const createFappyLegStart = (
  gates: readonly FappyGate[] = [],
  checkpointGate = 0
): FappyFrame => {
  const perchGate = gates[Math.min(checkpointGate, gates.length) - 1];

  if (checkpointGate <= 0 || perchGate === undefined) {
    return {
      tick: 0,
      bird: { y: FAPPY_WORLD.restY, vy: 0 },
      scrollX: 0,
      gatesCleared: 0,
      outcome: null
    };
  }

  return {
    tick: 0,
    bird: { y: resolveFappyPerchY(perchGate), vy: 0 },
    scrollX: perchGate.x + FAPPY_WORLD.gateWidth - FAPPY_WORLD.birdX + FAPPY_WORLD.birdRadius + 2,
    gatesCleared: Math.min(checkpointGate, gates.length),
    outcome: null
  };
};

const overlapsGate = (gateScreenX: number, birdY: number, gate: FappyGate, tick: number): boolean => {
  const { birdX, birdRadius, gateWidth } = FAPPY_WORLD;
  const isInColumn =
    birdX + birdRadius > gateScreenX && birdX - birdRadius < gateScreenX + gateWidth;

  if (!isInColumn) {
    return false;
  }

  if (birdY + birdRadius > resolveFappyChampTop(gate, tick)) {
    return true;
  }

  return gate.eagleBottom !== null && birdY - birdRadius < gate.eagleBottom;
};

/**
 * The whole physics, one tick. A terminal frame steps to itself, so callers can advance past
 * the outcome without guarding. A flap sets the vertical velocity; gravity accumulates to a
 * terminal fall; the ceiling stops the bird, the floor, a champ's head and an eagle kill it.
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

    if (overlapsGate(gateScreenX, y, gate, tick)) {
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

/**
 * Runs one attempt's log to its outcome from its checkpoint. This is the referee: the server
 * scores from nothing else.
 */
export const runFappyLeg = (
  course: FappyLegCourse,
  flapTicks: readonly number[],
  checkpointGate = 0
): FappyLegRun => {
  const gates = resolveFappyGates(course);
  const frame = advanceFappy(
    createFappyLegStart(gates, checkpointGate),
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
