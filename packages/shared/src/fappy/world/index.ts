import type { FappyGate, FappyLegCourse } from "../types.js";

/**
 * The fixed geometry and tuning every leg shares. World units are JOUST's: a 160×90 box the
 * renderer maps onto a 16:9 viewport, y growing downward, the floor a little above the bottom
 * edge. Speeds are per tick at `tickHz`, so a frame count is a duration on every machine.
 */
export const FAPPY_WORLD = {
  width: 160,
  height: 90,
  floorY: 84,
  /** The bird never moves sideways; the course scrolls past it. */
  birdX: 40,
  /** Hitbox radius. The drawn hen is a touch bigger, which is the forgiving side to err on. */
  birdRadius: 4.5,
  /** Where the bird hovers before the first flap. */
  restY: 42,
  gateWidth: 10,
  gapHeight: 30,
  gateSpacing: 66,
  /** The first gate's left edge at leg start, so the player gets a beat before the corridor. */
  firstGateX: 150,
  gapCentreMin: 26,
  gapCentreMax: 62,
  /** The most a gap centre moves from one gate to the next, so a section is always flyable. */
  gapMaxDrift: 20,
  tickHz: 60,
  gravity: 0.12,
  /** A flap SETS the vertical velocity rather than adding to it, the way the original feels. */
  flapVelocity: -1.6,
  maxFallVelocity: 2.8,
  scrollSpeed: 0.95
} as const;

/**
 * mulberry32: integer arithmetic only, so the stream is bit-identical on every engine. The
 * shared JOUST determinism rule (no implementation-defined Math member) is enforced by a test
 * over this whole module.
 */
export const createFappyRandom = (seed: number): (() => number) => {
  let state = seed | 0;

  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const clampGapCentre = (centre: number): number => {
  return Math.min(FAPPY_WORLD.gapCentreMax, Math.max(FAPPY_WORLD.gapCentreMin, centre));
};

/**
 * The gates for one leg. Seeded from the leg, not from the turn, so a leg can be redone or
 * rehydrated on its own; the first gap is anywhere in range and every next one drifts a bounded
 * amount, which keeps a section flyable without making it flat.
 */
export const resolveFappyGates = ({ seed, legIndex, gatesPerLeg }: FappyLegCourse): FappyGate[] => {
  const random = createFappyRandom((seed ^ Math.imul(legIndex + 1, 0x9e3779b1)) | 0);
  const gates: FappyGate[] = [];
  const centreRange = FAPPY_WORLD.gapCentreMax - FAPPY_WORLD.gapCentreMin + 1;
  let centre = FAPPY_WORLD.gapCentreMin + Math.floor(random() * centreRange);

  for (let gateOffset = 0; gateOffset < gatesPerLeg; gateOffset += 1) {
    if (gateOffset > 0) {
      const drift =
        Math.floor(random() * (2 * FAPPY_WORLD.gapMaxDrift + 1)) - FAPPY_WORLD.gapMaxDrift;
      centre = clampGapCentre(centre + drift);
    }

    gates.push({
      index: legIndex * gatesPerLeg + gateOffset,
      x: FAPPY_WORLD.firstGateX + gateOffset * FAPPY_WORLD.gateSpacing,
      gapTop: centre - FAPPY_WORLD.gapHeight / 2,
      gapBottom: centre + FAPPY_WORLD.gapHeight / 2
    });
  }

  return gates;
};

/**
 * How long a leg can possibly last: the course has scrolled entirely behind the bird well before
 * this, so a run that is still `flying` here is a bug, not a patient player.
 */
export const resolveFappyLegTickCap = (gatesPerLeg: number): number => {
  const courseLength =
    FAPPY_WORLD.firstGateX + gatesPerLeg * FAPPY_WORLD.gateSpacing + FAPPY_WORLD.width;

  return Math.ceil(courseLength / FAPPY_WORLD.scrollSpeed) + FAPPY_WORLD.tickHz;
};
