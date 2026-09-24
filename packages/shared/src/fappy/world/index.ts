import type { FappyChampKind, FappyGate, FappyLegCourse, FappySpit } from "../types.js";
import { createMulberry32, pickInteger } from "../../seededRandom/index.js";

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
  /**
   * The cliffs at both ends of a leg stand this high (their top's world y). The bird starts
   * perched on the left one and the leg ends when it lands on the right one.
   */
  cliffTop: 62,
  /** Where the start cliff drops away into the corridor. */
  startCliffEnd: 80,
  /** How far past the last gate the landing cliff's face stands. */
  landingCliffGap: 30,
  /**
   * The plateau the bird must come down on; past it a rock wall closes the sky. Wide enough for
   * the bird that lands and the one waiting to stand side by side (each is 16 units drawn).
   */
  landingZoneWidth: 56,
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
  /**
   * The kinds a course deals from, weighted by repetition: the bubblegum one is the corridor's
   * staple, the big dark one and the pale one break up the row.
   */
  champKinds: ["pink", "pink", "ebony", "ivory"] as readonly FappyChampKind[],
  /** The share of champs that spit. */
  spitterOdds: 0.4,
  /** A spitter's beat, in ticks; longer than a glob lives, so a champ has one glob out at a time. */
  spitPeriodMin: 130,
  spitPeriodMax: 200,
  /** A glob is gone after this long, whether or not it reached the sand. */
  spitLifeTicks: 70,
  /** A glob leaves the mouth this far under the top of the head. */
  spitMouthDepth: 3,
  spitRadius: 2,
  /** A glob's own speed towards the bird (leftward), on top of the scroll it rides. */
  spitSpeedX: 0.55,
  /** How hard a glob is thrown up, and what brings it back down. */
  spitRiseVelocity: 1.3,
  spitGravity: 0.045,
  /** A glob that lands shoves the bird down at this speed: harder than an eagle, still not a crash. */
  spitSplatVelocity: 1.8,
  /** How tall an eagle is, wingtip to talon. */
  eagleHeight: 10,
  /** An eagle hangs this much extra sky above the gap, at most, so gaps are not all the same. */
  eagleSlackMax: 8,
  /** Bumping an eagle shoves the bird down at this speed, on top of knocking the eagle away. */
  eagleBumpVelocity: 1,
  tickHz: 60,
  gravity: 0.12,
  /** A flap SETS the vertical velocity rather than adding to it, the way the original feels. */
  flapVelocity: -1.6,
  maxFallVelocity: 2.8,
  scrollSpeed: 0.95
} as const;

/**
 * The gates for one leg. Seeded from the leg, not from the turn, so a leg can be redone or
 * rehydrated on its own. Every gate has a champ from the floor, dealt a kind and, for some, a
 * spitting beat; about half also hang an eagle, always high enough that the gap at the champ's
 * full stretch is still `gapHeight`.
 */
export const resolveFappyGates = ({ seed, legIndex, gatesPerLeg }: FappyLegCourse): FappyGate[] => {
  const random = createMulberry32((seed ^ Math.imul(legIndex + 1, 0x9e3779b1)) | 0);
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
    const champKind =
      FAPPY_WORLD.champKinds[Math.floor(random() * FAPPY_WORLD.champKinds.length)] ?? "pink";
    const isSpitter = random() < FAPPY_WORLD.spitterOdds;
    const spitPeriodTicks = isSpitter
      ? pickInteger(random, FAPPY_WORLD.spitPeriodMin, FAPPY_WORLD.spitPeriodMax)
      : 0;
    const spitPhaseTicks = isSpitter ? pickInteger(random, 0, spitPeriodTicks - 1) : 0;

    gates.push({
      index: legIndex * gatesPerLeg + gateOffset,
      x: FAPPY_WORLD.firstGateX + gateOffset * FAPPY_WORLD.gateSpacing,
      champTop,
      champBob,
      champPeriodTicks,
      champPhaseTicks,
      champKind,
      spitPeriodTicks,
      spitPhaseTicks,
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

/**
 * Where a spitter is in its beat at this tick: 0 on the tick a glob leaves, counting up to the
 * period. Null for a champ that does not spit. The renderer opens the head over the last ticks
 * of the beat and snaps it shut over the first, so the tell and the glob agree on every screen.
 */
export const resolveFappySpitPhase = (gate: FappyGate, tick: number): number | null => {
  const period = gate.spitPeriodTicks;

  if (period <= 0) {
    return null;
  }

  return (((tick + gate.spitPhaseTicks) % period) + period) % period;
};

/**
 * The glob a champ has in the air at this tick, or null: none between beats, none once it has
 * lived `spitLifeTicks` or reached the sand. It leaves the mouth on the beat, thrown up and
 * towards the bird (leftward — the bird comes from that side), and falls on its own gravity.
 * Pure arithmetic in the launch tick and the age, so the tablet, the server and the TV put it
 * in the same place.
 */
export const resolveFappySpit = (gate: FappyGate, tick: number): FappySpit | null => {
  const age = resolveFappySpitPhase(gate, tick);

  if (age === null || age >= FAPPY_WORLD.spitLifeTicks) {
    return null;
  }

  const launchTick = tick - age;
  const launchX = gate.x + FAPPY_WORLD.gateWidth / 2;
  const launchY = resolveFappyChampTop(gate, launchTick) + FAPPY_WORLD.spitMouthDepth;
  const y =
    launchY - FAPPY_WORLD.spitRiseVelocity * age + (FAPPY_WORLD.spitGravity * age * age) / 2;

  if (y > FAPPY_WORLD.floorY) {
    return null;
  }

  return {
    gate: gate.index,
    launchTick,
    x: launchX - FAPPY_WORLD.spitSpeedX * age,
    y,
    age
  };
};

/** The middle of the gap at the champ's full stretch: the perch a bird respawns on. */
export const resolveFappyPerchY = (gate: FappyGate): number => {
  return ((gate.eagleBottom ?? 0) + gate.champTop - gate.champBob) / 2;
};

/** Where the landing cliff's face stands for a leg of this many gates. */
export const resolveFappyLandingX = (gatesPerLeg: number): number => {
  return (
    FAPPY_WORLD.firstGateX +
    Math.max(0, gatesPerLeg - 1) * FAPPY_WORLD.gateSpacing +
    FAPPY_WORLD.gateWidth +
    FAPPY_WORLD.landingCliffGap
  );
};

/**
 * Where the next player's bird stands waiting: well along the landing zone, so a bird that comes
 * down early on the plateau lands beside it and not on top of it. Renderer geometry only; the sim
 * never looks at the waiter.
 */
export const resolveFappyWaitingX = (gatesPerLeg: number): number => {
  return resolveFappyLandingX(gatesPerLeg) + FAPPY_WORLD.landingZoneWidth * 0.78;
};

/** Where a bird sits when it is standing on a cliff. */
export const resolveFappyCliffPerchY = (): number => {
  return FAPPY_WORLD.cliffTop - FAPPY_WORLD.birdRadius;
};

/**
 * How long a leg can possibly last: the course has scrolled entirely behind the bird well before
 * this, so a run that is still `flying` here is a bug, not a patient player.
 */
export const resolveFappyLegTickCap = (gatesPerLeg: number): number => {
  const courseLength =
    resolveFappyLandingX(gatesPerLeg) + FAPPY_WORLD.landingZoneWidth + FAPPY_WORLD.width;

  return Math.ceil(courseLength / FAPPY_WORLD.scrollSpeed) + FAPPY_WORLD.tickHz;
};
