import type { FappyFrame, FappyGate, FappyKnockedEagle, FappyLegCourse, FappyLegRun } from "../types.js";
import {
  FAPPY_WORLD,
  resolveFappyChampTop,
  resolveFappyCliffPerchY,
  resolveFappyGates,
  resolveFappyLandingX,
  resolveFappyLegTickCap,
  resolveFappyPerchY
} from "../world/index.js";

/**
 * The frame a leg (or an attempt at it) starts from. From the start line the bird stands on the
 * start cliff with nothing scrolled; from a checkpoint it sits on the perch of the last gate it
 * cleared, that gate just behind it, with its count intact. A checkpoint past the course clamps
 * to the last gate.
 */
export const createFappyLegStart = (
  gates: readonly FappyGate[] = [],
  checkpointGate = 0,
  knockedEagleGates: readonly number[] = []
): FappyFrame => {
  const perchGate = gates[Math.min(checkpointGate, gates.length) - 1];
  // Eagles knocked away on an earlier attempt stay gone; a renderer sees the
  // -1 and simply never draws them.
  const knockedEagles: FappyKnockedEagle[] = knockedEagleGates.map((gate) => ({ gate, tick: -1 }));

  if (checkpointGate <= 0 || perchGate === undefined) {
    return {
      tick: 0,
      bird: { y: resolveFappyCliffPerchY(), vy: 0 },
      scrollX: 0,
      gatesCleared: 0,
      knockedEagles,
      outcome: null
    };
  }

  return {
    tick: 0,
    bird: { y: resolveFappyPerchY(perchGate), vy: 0 },
    scrollX: perchGate.x + FAPPY_WORLD.gateWidth - FAPPY_WORLD.birdX + FAPPY_WORLD.birdRadius + 2,
    gatesCleared: Math.min(checkpointGate, gates.length),
    knockedEagles,
    outcome: null
  };
};

type GateContact = "none" | "champ" | "eagle";

const resolveGateContact = (
  gateScreenX: number,
  birdY: number,
  gate: FappyGate,
  tick: number,
  isEagleGone: boolean
): GateContact => {
  const { birdX, birdRadius, gateWidth } = FAPPY_WORLD;
  const isInColumn =
    birdX + birdRadius > gateScreenX && birdX - birdRadius < gateScreenX + gateWidth;

  if (!isInColumn) {
    return "none";
  }

  if (birdY + birdRadius > resolveFappyChampTop(gate, tick)) {
    return "champ";
  }

  if (!isEagleGone && gate.eagleBottom !== null && birdY - birdRadius < gate.eagleBottom) {
    return "eagle";
  }

  return "none";
};

/**
 * The whole physics, one tick. A terminal frame steps to itself, so callers can advance past
 * the outcome without guarding. A flap sets the vertical velocity; gravity accumulates to a
 * terminal fall; the ceiling stops the bird, the start cliff holds it up, the floor, a champ's
 * head, an eagle, the landing cliff's face and the far wall kill it, and coming down on the
 * landing plateau ends the leg cleared.
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

  const {
    birdRadius,
    floorY,
    gravity,
    flapVelocity,
    maxFallVelocity,
    scrollSpeed,
    gateWidth,
    birdX,
    eagleBumpVelocity
  } = FAPPY_WORLD;
  const vy = didFlap ? flapVelocity : Math.min(frame.bird.vy + gravity, maxFallVelocity);
  let y = frame.bird.y + vy;
  let nextVy = vy;
  const scrollX = frame.scrollX + scrollSpeed;
  const tick = frame.tick + 1;

  if (y - birdRadius < 0) {
    y = birdRadius;
    nextVy = 0;
  }

  const cliffPerchY = resolveFappyCliffPerchY();

  // Still over the start cliff: solid ground, not a fall. A bird that comes
  // back down before the drop just stands there again.
  if (birdX - birdRadius < FAPPY_WORLD.startCliffEnd - scrollX && y > cliffPerchY) {
    y = cliffPerchY;
    nextVy = 0;
  }

  const landingScreenX = resolveFappyLandingX(gatesPerLeg) - scrollX;
  const wallScreenX = landingScreenX + FAPPY_WORLD.landingZoneWidth;

  if (birdX + birdRadius > landingScreenX) {
    // Past the plateau the rock closes the sky; into the face, below the top,
    // is the same crash. Anywhere on the plateau, the leg is flown.
    const isIntoWall = birdX + birdRadius > wallScreenX;
    const isBelowTop = y > cliffPerchY;
    const isOverPlateau = birdX >= landingScreenX;

    if (isIntoWall || (isBelowTop && !isOverPlateau)) {
      return {
        tick,
        bird: { y, vy: nextVy },
        scrollX,
        gatesCleared: frame.gatesCleared,
        knockedEagles: frame.knockedEagles,
        outcome: "crashed"
      };
    }

    if (isBelowTop) {
      return {
        tick,
        bird: { y: cliffPerchY, vy: 0 },
        scrollX,
        gatesCleared: Math.max(frame.gatesCleared, gatesPerLeg),
        knockedEagles: frame.knockedEagles,
        outcome: "cleared"
      };
    }
  }

  if (y + birdRadius >= floorY) {
    return {
      tick,
      bird: { y: floorY - birdRadius, vy: nextVy },
      scrollX,
      gatesCleared: frame.gatesCleared,
      knockedEagles: frame.knockedEagles,
      outcome: "crashed"
    };
  }

  let gatesCleared = 0;
  let knockedEagles = frame.knockedEagles;

  for (const gate of gates) {
    const gateScreenX = gate.x - scrollX;
    const isEagleGone = knockedEagles.some((knocked) => knocked.gate === gate.index);
    const contact = resolveGateContact(gateScreenX, y, gate, tick, isEagleGone);

    if (contact === "champ") {
      return {
        tick,
        bird: { y, vy: nextVy },
        scrollX,
        gatesCleared: frame.gatesCleared,
        knockedEagles,
        outcome: "crashed"
      };
    }

    // Bumping an eagle is not a crash: the eagle is knocked out of the sky
    // for the rest of the leg and the bird is shoved down for its trouble.
    if (contact === "eagle") {
      knockedEagles = [...knockedEagles, { gate: gate.index, tick }];
      nextVy = Math.max(nextVy, eagleBumpVelocity);
    }

    if (gateScreenX + gateWidth < birdX - birdRadius) {
      gatesCleared += 1;
    }
  }

  return {
    tick,
    bird: { y, vy: nextVy },
    scrollX,
    gatesCleared: Math.max(frame.gatesCleared, gatesCleared),
    knockedEagles,
    outcome: null
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
  checkpointGate = 0,
  knockedEagleGates: readonly number[] = []
): FappyLegRun => {
  const gates = resolveFappyGates(course);
  const frame = advanceFappy(
    createFappyLegStart(gates, checkpointGate, knockedEagleGates),
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
