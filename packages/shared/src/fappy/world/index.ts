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
  /** Where the bird hovers before the first flap of a leg. */
  restY: 42,
  gateWidth: 10,
  /** The least sky a gate leaves between the champ at full stretch and whatever hangs above. */
  gapHeight: 30,
  gateSpacing: 66,
  /** The first gate's left edge at leg start, so the player gets a beat before the corridor. */
  firstGateX: 150,
  /** The champ's head at rest sits somewhere in this band of world y. */
  champTopMin: 44,
  champTopMax: 68,
  /** The bob heights a champ may have; a 0 stands still. */
  champBobs: [0, 6, 10, 14] as readonly number[],
  champPeriodMin: 80,
  champPeriodMax: 140,
  /** How tall an eagle is, wingtip to talon. */
  eagleHeight: 10,
  /** An eagle hangs this much extra sky above the gap, at most, so gaps are not all the same. */
  eagleSlackMax: 8,
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

const pickInteger = (random: () => number, min: number, max: number): number => {
  return min + Math.floor(random() * (max - min + 1));
};

/**
 * The gates for one leg. Seeded from the leg, not from the turn, so a leg can be redone or
 * rehydrated on its own. Every gate has a champ from the floor; about half also hang an eagle,
 * always high enough that the gap at the champ's full stretch is still `gapHeight`.
 */
export const resolveFappyGates = ({ seed, legIndex, gatesPerLeg }: FappyLegCourse): FappyGate[] => {
  const random = createFappyRandom((seed ^ Math.imul(legIndex + 1, 0x9e3779b1)) | 0);
  const gates: FappyGate[] = [];

  for (let gateOffset = 0; gateOffset < gatesPerLeg; gateOffset += 1) {
    const champTop = pickInteger(random, FAPPY_WORLD.champTopMin, FAPPY_WORLD.champTopMax);
    const champBob =
      FAPPY_WORLD.champBobs[Math.floor(random() * FAPPY_WORLD.champBobs.length)] ?? 0;
    const champPeriodTicks = pickInteger(
      random,
      FAPPY_WORLD.champPeriodMin,
      FAPPY_WORLD.champPeriodMax
    );
    const champPhaseTicks = pickInteger(random, 0, champPeriodTicks - 1);
    const skyAboveGap = champTop - champBob - FAPPY_WORLD.gapHeight;
    const wantsEagle = random() < 0.5;
    const eagleRoom = skyAboveGap - FAPPY_WORLD.eagleHeight - 4;
    const eagleBottom =
      wantsEagle && eagleRoom >= 0
        ? skyAboveGap - pickInteger(random, 0, Math.min(FAPPY_WORLD.eagleSlackMax, eagleRoom))
        : null;

    gates.push({
      index: legIndex * gatesPerLeg + gateOffset,
      x: FAPPY_WORLD.firstGateX + gateOffset * FAPPY_WORLD.gateSpacing,
      champTop,
      champBob,
      champPeriodTicks,
      champPhaseTicks,
      eagleBottom
    });
  }

  return gates;
};

/** 0 → 1 → 0 over one period: a triangle wave, exact on every engine. */
export const resolveFappyWave = (tick: number, periodTicks: number, phaseTicks: number): number => {
  const phase = (((tick + phaseTicks) % periodTicks) + periodTicks) % periodTicks;
  const half = periodTicks / 2;

  return phase < half ? phase / half : 2 - phase / half;
};

/** Where the top of the champ's head is at this tick. */
export const resolveFappyChampTop = (gate: FappyGate, tick: number): number => {
  return (
    gate.champTop - gate.champBob * resolveFappyWave(tick, gate.champPeriodTicks, gate.champPhaseTicks)
  );
};

/** The middle of the gap at the champ's full stretch: the perch a bird respawns on. */
export const resolveFappyPerchY = (gate: FappyGate): number => {
  return ((gate.eagleBottom ?? 0) + gate.champTop - gate.champBob) / 2;
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
