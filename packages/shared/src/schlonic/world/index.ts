import type {
  SchlonicHazardKind,
  SchlonicPit,
  SchlonicProp,
  SchlonicRideOnKind,
  SchlonicZone,
  SchlonicZoneCourse
} from "../types.js";
import { createMulberry32, pickInteger } from "../../seededRandom/index.js";

/**
 * The fixed geometry and tuning every zone shares. World units are JOUST's and FAPPY's: a 160×90
 * box the renderer maps onto a 16:9 viewport, y growing downward. Speeds are per tick at `tickHz`,
 * so a tick count is a duration on every machine.
 */
export const SCHLONIC_WORLD = {
  width: 160,
  height: 90,
  /** The runner never moves sideways on screen; the zone scrolls past it. */
  runnerX: 46,
  runnerRadius: 4,
  /** The ground's nominal height. A hill rises above it, a dip falls below. */
  groundBaseY: 66,
  /** The highest and lowest the ground may ever get, so the zone always fits the box. */
  groundMinY: 38,
  groundMaxY: 76,
  /** Ground samples this far apart; the ground between two samples is a straight line. */
  sampleStep: 10,
  /** One piece of zone kit, six samples wide. */
  chunkWidth: 60,
  /** Nothing is under a pit, so the runner falls through the box and the run is over. */
  pitFloorY: 400,
  pitDeathY: 104,
  /** How wide a hole in the ground is: wide enough that only a jump gets over it. */
  pitWidth: 22,
  /**
   * The finale's hole, before the post: wider than a tap clears, so it takes the kicker in
   * front of it or a held jump off the lip — and the kicker is where the arc of high-line
   * wings hangs.
   */
  finalePitWidth: 34,
  /** A wing hung at least this far above the ground is on the high line, and worth two. */
  highLineAbove: 20,
  highLineWorth: 2,
  /** The high line's wings are drawn and reached this much bigger, so what you see is what you hit. */
  highLineWingScale: 1.35,
  /**
   * How far below the lip counts as being in the hole rather than over it. Deeper than the
   * coyote window can fall (`coyoteTicks` of the heavier gravity is about four units), because
   * the lip is exactly where a late tap has to still count.
   */
  pitLipTolerance: 6,
  tickHz: 60,
  gravity: 0.115,
  /**
   * Gravity while the button is still down and the runner is still going up: the held jump. A
   * tap tops out about 17 up, a full hold about 30 — far enough apart that choosing one means
   * something, and the hold still short of the finale's arc, which is the kicker's to reach.
   */
  holdGravityShare: 0.55,
  /**
   * Gravity once past the peak, over the ordinary pull: the same height, a shorter hang. A
   * symmetric arc floated; a rider that comes down harder than it went up lands like a landing
   * and tightens the timing over the crowd.
   */
  fallGravityShare: 1.6,
  jumpVelocity: -1.95,
  maxFallVelocity: 3.2,
  /**
   * A press this many ticks after the feet left the ground — off a ledge, off a rail's end,
   * down a drop — still jumps: the coyote window. Never after a jump, which is going up.
   */
  coyoteTicks: 6,
  /**
   * A press this many ticks before the feet come down fires the tick after they do: the jump
   * buffer, so a tap a hair early is not a tap wasted.
   */
  jumpBufferTicks: 8,
  /**
   * A press in the air, past the coyote window and with this much clear under the feet, slams
   * the rider straight down at `slamVelocity`: the one verb the air has. Closer to the surface
   * than this, the press is a buffered jump instead — a tap just before landing means "jump
   * when I land", not "drop".
   */
  slamMinClearance: 8,
  slamVelocity: 4.4,
  /** What the legs can do on the flat. Downhill beats it; the drag bleeds it back afterwards. */
  topSpeed: 1.35,
  acceleration: 0.016,
  drag: 0.006,
  /** A downhill's gradient is worth this much speed a tick; an uphill costs the same. */
  slopeAcceleration: 0.052,
  /** However badly it goes, the runner never comes to a stop — the room would be waiting. */
  minSpeed: 0.34,
  wingRadius: 2.6,
  /** The kicker ramp: a plywood wedge you roll into, its lip this high at the far side. */
  kickerHeight: 6,
  kickerWidth: 10,
  /** What a kicker is for: the high wing line, which the legs alone cannot reach. */
  kickerVelocity: -3.4,
  /**
   * The handrail stands this far over level ground: just under a tap's peak (the feet top out
   * about 17.5 up), so a tap timed right comes down on it — and just over the rider's head (the
   * hen on its board stands about 14 tall, its tube hangs 1.7 under this line), so a bird that
   * stays on the street rolls clean under the bar rather than looking speared by it. It runs
   * most of its chunk, longer than a hop's whole arc, so a hop can only sweep the end of the
   * line strung along it and the grind is the one way to take all of it. The other furniture
   * stands lower and shorter (`SCHLONIC_RIDE_ONS`).
   */
  railAbove: 16.5,
  railLength: 48,
  /**
   * A rail has no slope and no drag, so the board keeps the speed it arrived with — up to this.
   * Nothing in a zone arrives near it (a runner tops out around 1.4); it is there so a rail can
   * never be where the sim runs away with itself.
   */
  grindMaxSpeed: 2.2,
  /** A hit costs half the handful, knocks the runner back, and buys this long to recover. */
  invulnerableTicks: 70,
  hitSpeedShare: 0.45,
  hitBounceVelocity: -1.1
} as const;

/**
 * The crowd, as boxes: how wide and how tall each stands, and for the ones that move, how far
 * either side of their spot they sway and how many ticks a full there-and-back takes. A sway is
 * a triangle wave on the tick (`resolveSchlonicHazardX`): the same on every machine, and no
 * trigonometry in the sim. Heights are against a tap's peak (the feet top out about 17.5 up):
 * the low, wide ones are jumped late, the tall ones want a held tap, and the movers are the
 * timing.
 */
export const SCHLONIC_HAZARDS: Record<
  SchlonicHazardKind,
  { width: number; height: number; sway: number; swayTicks: number }
> = {
  /** A dome tent on the sidewalk, with its tarp and its pylon: wide, and jumped from well back. */
  tent: { width: 18, height: 9, sway: 0, swayTicks: 0 },
  /** Somebody asleep on the pavers in a hoodie: long and low, so the hop comes late. */
  sleeper: { width: 15, height: 4.5, sway: 0, swayTicks: 0 },
  /** The crust punk sat against the wall with a can: short, still, easy. */
  punk: { width: 7, height: 8, sway: 0, swayTicks: 0 },
  /** The metalhead wheeling a bass cab across the sidewalk: tall, wide, and slow. */
  roadie: { width: 11, height: 12, sway: 7, swayTicks: 260 },
  /** The show-goer weaving out of the bar: tall and unpredictable. */
  stagger: { width: 7, height: 12, sway: 9, swayTicks: 150 },
  /** The goose off the waterfront: small, quick, and it will not get out of the way. */
  goose: { width: 7, height: 6, sway: 5, swayTicks: 110 }
};

/**
 * The furniture, as ledges: how high its top stands over the ground, how long it runs, and how
 * many wings ride it. The handrail is the high, long one (`railAbove`); a bench and a planter
 * ledge are a tap's easy landing, and a parked car's roof is in between.
 */
export const SCHLONIC_RIDE_ONS: Record<SchlonicRideOnKind, { above: number; length: number; wings: number }> = {
  rail: { above: SCHLONIC_WORLD.railAbove, length: SCHLONIC_WORLD.railLength, wings: 6 },
  bench: { above: 9, length: 26, wings: 3 },
  ledge: { above: 6, length: 32, wings: 4 },
  car: { above: 13.5, length: 30, wings: 4 }
};

const HAZARD_KINDS: readonly SchlonicHazardKind[] = ["tent", "sleeper", "punk", "roadie", "stagger", "goose"];
const RIDE_ON_KINDS: readonly SchlonicRideOnKind[] = ["rail", "bench", "ledge", "car"];

/**
 * Where a swaying hazard is on `tick`: its spot, plus a triangle wave of its sway — out to one
 * side, back through the middle, out to the other, and back — a full cycle every `swayTicks`.
 * Pure arithmetic on the integer tick, so the tablet, the referee and the wall agree to the bit.
 */
export const resolveSchlonicHazardX = (prop: SchlonicProp, tick: number): number => {
  const spec = prop.kind === "hazard" && prop.hazard !== undefined ? SCHLONIC_HAZARDS[prop.hazard] : null;

  if (spec === null || spec.sway === 0 || spec.swayTicks <= 0) {
    return prop.x;
  }

  const phase = (((tick % spec.swayTicks) + spec.swayTicks) % spec.swayTicks) / spec.swayTicks;
  const wave = phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4;

  return prop.x + spec.sway * wave;
};

/** The box a hazard fills: half its width either side of where it is, and its height off its ground. */
export const resolveSchlonicHazardBox = (prop: SchlonicProp): { halfWidth: number; height: number } => {
  const spec = SCHLONIC_HAZARDS[prop.hazard ?? "punk"];

  return { halfWidth: spec.width / 2, height: spec.height };
};

/**
 * The kit a zone is built from, in two piles. The hard kit asks something of the player; the
 * soft kit is the running room between, where the speed and the greedy lines live. The hard
 * beat is trench, crowd, furniture, kicker, crowd, furniture: something to jump twice as often
 * as something to land on, and the ramp once a lap.
 */
const HARD_KINDS = ["pit", "crowd", "rideOn", "kicker", "crowd", "rideOn"] as const;
const SOFT_KINDS = ["flat", "hill", "dip", "rise", "drop"] as const;

/**
 * The finale: the chunk before the last, on every zone. A kicker, then a hole wider than a tap
 * clears, then the post. The last ten seconds of a run are the loudest thing in it, not the
 * coast they used to be, and the biggest arc of the zone hangs in the kicker's flight.
 */
const FINALE_KIND = "finale" as const;

type ChunkKind = (typeof HARD_KINDS)[number] | (typeof SOFT_KINDS)[number] | typeof FINALE_KIND;

/** Where the finale's kit stands inside its chunk. */
const FINALE_KICKER_AT = 8;
const FINALE_PIT_AT = 22;
/** Where a piece of furniture starts inside its chunk; one of the crowd stands at its far end. */
const RIDE_ON_AT = 4;
/** How far in from a ride-on's start the first wing of its line hangs. */
const RIDE_ON_LINE_INSET = 2;
/** Where the crowd stands in a crowd chunk: room for the widest sway either side. */
const CROWD_AT = 30;
/** How high the floor's wing lines hang: in a walker's reach, and under the tall furniture. */
const FLOOR_LINE_ABOVE = 9;
/** The post is two chunks off once the runner is here: the finale has begun. */
export const SCHLONIC_FINALE_CHUNKS = 2;

/** One piece of kit in every three asks something of the player; the rest is running room. */
const HARD_CHUNK_INTERVAL = 3;

/** Samples per chunk, and the sample the chunk starts from. */
const SAMPLES_PER_CHUNK = SCHLONIC_WORLD.chunkWidth / SCHLONIC_WORLD.sampleStep;

const clampHeight = (height: number): number => {
  return Math.max(SCHLONIC_WORLD.groundMinY, Math.min(SCHLONIC_WORLD.groundMaxY, height));
};

/** The six height offsets a chunk adds to its entry height, crest first-to-last. */
const resolveChunkProfile = (kind: ChunkKind, random: () => number): number[] => {
  if (kind === "hill") {
    const rise = pickInteger(random, 14, 24);

    return [-rise / 3, -(rise * 2) / 3, -rise, -rise, -(rise * 2) / 3, 0];
  }

  if (kind === "dip") {
    const fall = pickInteger(random, 8, 14);

    return [fall / 3, (fall * 2) / 3, fall, fall, (fall * 2) / 3, 0];
  }

  if (kind === "rise") {
    const rise = pickInteger(random, 10, 18);

    return [-rise / 3, -(rise * 2) / 3, -rise, -rise, -rise, -rise];
  }

  if (kind === "drop") {
    const fall = pickInteger(random, 10, 18);

    return [fall / 3, (fall * 2) / 3, fall, fall, fall, fall];
  }

  return [0, 0, 0, 0, 0, 0];
};

/**
 * Which piece of kit each chunk is. The first two and the last are always level going — a run-up
 * to read the zone from, and a straight to the post — and in between the hard kit lands on a
 * fixed beat rather than wherever the roll drops it. A zone is a rhythm; a lottery is what you
 * get when nine kinds each roll for every slot, and what the room gets then is three pits in a
 * row for one team and none for the next.
 */
const resolveChunkKinds = (
  random: () => number,
  chunks: number,
  hardCursorStart: number | null = null
): { kinds: ChunkKind[]; hardCursor: number } => {
  const kinds: ChunkKind[] = [];
  // The hard kit rotates rather than rolls, from a seeded starting point: over a zone every team
  // meets each piece about equally often. Rolling each slot independently is how a seed ends up
  // with six of one thing and not one trench, and the zone is a rule — the whole round runs the
  // one it drew. A later leg of a course picks the rotation up where the leg before left it, so
  // the street keeps changing down its length rather than dealing every leg the same kit.
  let hardCursor = hardCursorStart ?? Math.floor(random() * HARD_KINDS.length);

  for (let chunk = 0; chunk < chunks; chunk += 1) {
    if (chunk < 2 || chunk === chunks - 1) {
      kinds.push("flat");
      continue;
    }

    if (chunk === chunks - 2) {
      kinds.push(FINALE_KIND);
      continue;
    }

    if (chunk % HARD_CHUNK_INTERVAL === 2) {
      kinds.push(HARD_KINDS[hardCursor % HARD_KINDS.length] ?? "flat");
      hardCursor += 1;
      continue;
    }

    kinds.push(SOFT_KINDS[Math.floor(random() * SOFT_KINDS.length)] ?? "flat");
  }

  return { kinds, hardCursor };
};

/**
 * Every height sample of the zone, plus one flat chunk past the goal so a runner who crosses the
 * post still has ground under it while the room reads the score.
 */
const resolveHeights = (kinds: readonly ChunkKind[], random: () => number): number[] => {
  const heights: number[] = [SCHLONIC_WORLD.groundBaseY];
  let entry: number = SCHLONIC_WORLD.groundBaseY;

  for (const kind of kinds) {
    const profile = resolveChunkProfile(kind, random);

    for (const offset of profile) {
      heights.push(clampHeight(entry + offset));
    }

    entry = heights[heights.length - 1] ?? entry;
  }

  // The run-out past the post.
  for (let sample = 0; sample < SAMPLES_PER_CHUNK; sample += 1) {
    heights.push(entry);
  }

  return heights;
};

const groundAt = (heights: readonly number[], pits: readonly SchlonicPit[], x: number): number => {
  for (const pit of pits) {
    if (x >= pit.fromX && x <= pit.toX) {
      return SCHLONIC_WORLD.pitFloorY;
    }
  }

  const position = x / SCHLONIC_WORLD.sampleStep;
  const sample = Math.floor(position);

  if (sample < 0) {
    return heights[0] ?? SCHLONIC_WORLD.groundBaseY;
  }

  const last = heights.length - 1;

  if (sample >= last) {
    return heights[last] ?? SCHLONIC_WORLD.groundBaseY;
  }

  const from = heights[sample] ?? SCHLONIC_WORLD.groundBaseY;
  const to = heights[sample + 1] ?? from;

  return from + (to - from) * (position - sample);
};

/** Where the ground is under `x`. Over a pit there is none, and the number says so. */
export const resolveSchlonicGroundY = (zone: SchlonicZone, x: number): number => {
  return groundAt(zone.heights, zone.pits, x);
};

/** How steeply the ground runs at `x`: positive downhill, which is where the speed comes from. */
export const resolveSchlonicGroundSlope = (zone: SchlonicZone, x: number): number => {
  const sample = Math.floor(x / SCHLONIC_WORLD.sampleStep);
  const last = zone.heights.length - 1;

  if (sample < 0 || sample >= last) {
    return 0;
  }

  const from = zone.heights[sample] ?? 0;
  const to = zone.heights[sample + 1] ?? from;

  return (to - from) / SCHLONIC_WORLD.sampleStep;
};

export const isSchlonicOverPit = (zone: SchlonicZone, x: number): boolean => {
  return zone.pits.some((pit) => x >= pit.fromX && x <= pit.toX);
};

/**
 * The runner is in the hole rather than over it: a jump that came up short. There is no climbing
 * out — the ground it would stand on is the far lip, and it is already past that.
 */
export const isSchlonicInPit = (zone: SchlonicZone, x: number, y: number): boolean => {
  return zone.pits.some((pit) => {
    return (
      x >= pit.fromX &&
      x <= pit.toX &&
      y + SCHLONIC_WORLD.runnerRadius > pit.lipY + SCHLONIC_WORLD.pitLipTolerance
    );
  });
};

type PropPlacer = {
  heights: readonly number[];
  pits: readonly SchlonicPit[];
  props: SchlonicProp[];
  /** Which of the crowd and which furniture comes next: each rotates, from a seeded start. */
  hazardCursor: number;
  rideOnCursor: number;
};

const addKicker = (placer: PropPlacer, x: number): void => {
  placer.props.push({ index: placer.props.length, kind: "kicker", x, y: groundAt(placer.heights, placer.pits, x) });
};

/** The next of the crowd, stood at `x` on its ground. */
const addHazard = (placer: PropPlacer, x: number): void => {
  const hazard = HAZARD_KINDS[placer.hazardCursor % HAZARD_KINDS.length] ?? "punk";

  placer.hazardCursor += 1;
  placer.props.push({
    index: placer.props.length,
    kind: "hazard",
    hazard,
    x,
    y: groundAt(placer.heights, placer.pits, x)
  });
};

/** What a wing hung `above` the ground is worth: two on the high line and one on the floor. */
const resolveWingWorth = (above: number): number => {
  return above >= SCHLONIC_WORLD.highLineAbove ? SCHLONIC_WORLD.highLineWorth : 1;
};

const addWing = (placer: PropPlacer, x: number, y: number, worth: number): void => {
  placer.props.push({ index: placer.props.length, kind: "wing", x, y, ...(worth === 1 ? {} : { worth }) });
};

/** A line of wings hanging `above` the ground, one every 10 units. */
const addWingRun = (placer: PropPlacer, fromX: number, count: number, above: number): void => {
  for (let step = 0; step < count; step += 1) {
    const x = fromX + step * 10;
    const ground = groundAt(placer.heights, placer.pits, x);
    const floor = ground >= SCHLONIC_WORLD.pitFloorY ? SCHLONIC_WORLD.groundBaseY : ground;

    addWing(placer, x, Math.max(6, floor - above), resolveWingWorth(above));
  }
};

/** A shallow arc of wings, the shape of a jump: the greedy line over a pit or a crest. */
const addWingArc = (placer: PropPlacer, fromX: number, count: number, above: number): void => {
  const middle = (count - 1) / 2;

  for (let step = 0; step < count; step += 1) {
    const x = fromX + step * 10;
    const ground = groundAt(placer.heights, placer.pits, x);
    const floor = ground >= SCHLONIC_WORLD.pitFloorY ? SCHLONIC_WORLD.groundBaseY : ground;
    const lift = 7 * (1 - ((step - middle) * (step - middle)) / Math.max(1, middle * middle));

    addWing(placer, x, Math.max(6, floor - above - lift), resolveWingWorth(above + lift));
  }
};

/** What each chunk hangs over its own ground. */
const addChunkProps = (
  placer: PropPlacer,
  kind: ChunkKind,
  chunkX: number,
  random: () => number
): void => {
  if (kind === "pit") {
    addWingArc(placer, chunkX + 14, 5, 15);
    return;
  }

  if (kind === "crowd") {
    const crowdX = chunkX + CROWD_AT;
    const spec = SCHLONIC_HAZARDS[HAZARD_KINDS[placer.hazardCursor % HAZARD_KINDS.length] ?? "punk"];

    addHazard(placer, crowdX);
    // A floor line on the way in, and the greedy arc over whoever it is: high enough to clear
    // their head with the hop that clears them.
    addWingRun(placer, chunkX + 6, 2, 9);
    addWingArc(placer, crowdX - 10, 3, spec.height + 9);
    return;
  }

  if (kind === "kicker") {
    const kickerX = chunkX + 22;

    addKicker(placer, kickerX);

    // The payoff hangs where only the kicker reaches: a column climbing away from the lip.
    for (let step = 0; step < 4; step += 1) {
      const x = kickerX + 6 + step * 9;
      const ground = groundAt(placer.heights, placer.pits, x);
      const above = 22 + step * 7;

      addWing(placer, x, Math.max(6, ground - above), resolveWingWorth(above));
    }

    addWingRun(placer, chunkX + 44, 2, 9);
    return;
  }

  if (kind === "rideOn") {
    const { runnerRadius, wingRadius, highLineWorth } = SCHLONIC_WORLD;
    const rideOn = RIDE_ON_KINDS[placer.rideOnCursor % RIDE_ON_KINDS.length] ?? "rail";
    const spec = SCHLONIC_RIDE_ONS[rideOn];
    const fromX = chunkX + RIDE_ON_AT;
    const toX = fromX + spec.length;
    const ground = groundAt(placer.heights, placer.pits, fromX);
    const topY = ground - spec.above;

    placer.rideOnCursor += 1;
    // One of the crowd waits at the far end: a bird that stayed on the floor meets them late,
    // and a hop over them leaves the ground too late to sweep more than the tail of the line.
    addHazard(placer, toX);

    const crowd = placer.props[placer.props.length - 1];
    const crowdHalfWidth = crowd === undefined ? 0 : resolveSchlonicHazardBox(crowd).halfWidth;

    placer.props.push({ index: placer.props.length, kind: "rail", rideOn, x: fromX, toX, y: topY });

    // The greedy line rides the top, just over it, evenly from the near end to where the crowd
    // begins: a grinding bird's body passes through every wing and a walking one's reaches
    // none. Worth two however low it hangs, because only the grind collects the lot.
    const lineFrom = fromX + RIDE_ON_LINE_INSET;
    const lineTo = toX - crowdHalfWidth + 1;

    for (let step = 0; step < spec.wings; step += 1) {
      const x = lineFrom + ((lineTo - lineFrom) * step) / Math.max(1, spec.wings - 1);

      addWing(placer, x, topY - runnerRadius - wingRadius, highLineWorth);
    }

    // The floor line under the near end, for whoever stays down: what the grind gives up. Only
    // under the tall furniture — under a bench or a planter a floor wing would hang over the top.
    if (spec.above > FLOOR_LINE_ABOVE + SCHLONIC_WORLD.wingRadius) {
      addWingRun(placer, chunkX + 12, 2, FLOOR_LINE_ABOVE);
    }

    return;
  }

  if (kind === FINALE_KIND) {
    const kickerX = chunkX + FINALE_KICKER_AT;

    addKicker(placer, kickerX);
    // The biggest arc in the zone, over the hole, where the kicker throws you: five on the
    // high line, and a low line under them for whoever jumps it off the lip instead.
    addWingArc(placer, kickerX + 8, 5, 28);
    addWingArc(placer, kickerX + 14, 4, 12);
    return;
  }

  if (kind === "hill") {
    addWingArc(placer, chunkX + 14, 4, 10);
    // The high line: reachable only by leaving the crest at speed.
    addWingRun(placer, chunkX + 24, 3, 22);
    return;
  }

  if (kind === "dip") {
    addWingRun(placer, chunkX + 14, 4, 9);
    // Straight across the dip, for whoever would rather keep their speed than collect the floor.
    addWingRun(placer, chunkX + 20, 3, 20);
    return;
  }

  addWingRun(placer, chunkX + 10, pickInteger(random, 4, 5), 9);
};

/** How many legs a course has, and which one a run is: one and the first unless it says. */
const resolveCourseLegs = ({ legs = 1, leg = 0 }: SchlonicZoneCourse): { legs: number; leg: number } => {
  const count = Math.max(1, Math.floor(legs));

  return { legs: count, leg: Math.max(0, Math.min(count - 1, Math.floor(leg))) };
};

/** Where a leg's start line is on the course, in course x. */
export const resolveSchlonicLegFromX = (course: SchlonicZoneCourse): number => {
  const { leg } = resolveCourseLegs(course);

  return leg * Math.max(3, course.chunks) * SCHLONIC_WORLD.chunkWidth;
};

/**
 * The whole street, every leg end to end, laid out from its seed. Each leg is dealt as a zone
 * of its own — two level chunks to read it from, the hard kit on its beat, a finale and a post
 * — and the ground runs on from one into the next, so a handoff is a line on one sidewalk and
 * not a cut. Every team in the round runs the same one: the seed is a rule, not a roll, so the
 * night is a race over the same street rather than a lottery. The strip over the TV draws
 * this; a run is played on one leg of it (`resolveSchlonicZone`).
 */
export const resolveSchlonicCourse = (course: SchlonicZoneCourse): SchlonicZone => {
  const { legs } = resolveCourseLegs(course);
  const random = createMulberry32(course.seed | 0);
  const kinds: ChunkKind[] = [];
  let hardCursor: number | null = null;

  for (let leg = 0; leg < legs; leg += 1) {
    const dealt = resolveChunkKinds(random, Math.max(3, course.chunks), hardCursor);

    kinds.push(...dealt.kinds);
    hardCursor = dealt.hardCursor;
  }

  const heights = resolveHeights(kinds, random);
  const pits: SchlonicPit[] = kinds.flatMap((kind, chunk) => {
    if (kind === FINALE_KIND) {
      const fromX = chunk * SCHLONIC_WORLD.chunkWidth + FINALE_PIT_AT;

      return [{ fromX, toX: fromX + SCHLONIC_WORLD.finalePitWidth, lipY: groundAt(heights, [], fromX) }];
    }

    if (kind !== "pit") {
      return [];
    }

    const fromX = chunk * SCHLONIC_WORLD.chunkWidth + 16;

    return [
      {
        fromX,
        toX: fromX + SCHLONIC_WORLD.pitWidth,
        lipY: groundAt(heights, [], fromX)
      }
    ];
  });
  // The crowd and the furniture each rotate from their own seeded start, so one street never
  // deals the same face twice running and a seed's first ride-on is not always the handrail.
  const placer: PropPlacer = {
    heights,
    pits,
    props: [],
    hazardCursor: Math.floor(random() * HAZARD_KINDS.length),
    rideOnCursor: Math.floor(random() * RIDE_ON_KINDS.length)
  };

  kinds.forEach((kind, chunk) => {
    addChunkProps(placer, kind, chunk * SCHLONIC_WORLD.chunkWidth, random);
  });

  return {
    heights,
    pits,
    props: placer.props,
    goalX: kinds.length * SCHLONIC_WORLD.chunkWidth
  };
};

/**
 * One leg of the course as the zone a run is played on: its stretch of ground, its holes and
 * its kit, rebased so its start line is x 0 and its post is `goalX`, with the next leg's run-up
 * as the ground past the post (the course's own run-out on the last). A course of one leg is
 * the whole street, untouched.
 */
export const resolveSchlonicZone = (course: SchlonicZoneCourse): SchlonicZone => {
  const whole = resolveSchlonicCourse(course);
  const { legs } = resolveCourseLegs(course);

  if (legs === 1) {
    return whole;
  }

  const legWidth = Math.max(3, course.chunks) * SCHLONIC_WORLD.chunkWidth;
  const fromX = resolveSchlonicLegFromX(course);
  const toX = fromX + legWidth;
  const fromSample = fromX / SCHLONIC_WORLD.sampleStep;
  const legSamples = legWidth / SCHLONIC_WORLD.sampleStep;

  return {
    heights: whole.heights.slice(fromSample, fromSample + legSamples + SAMPLES_PER_CHUNK + 1),
    pits: whole.pits.flatMap((pit) => {
      return pit.fromX >= fromX && pit.fromX < toX
        ? [{ fromX: pit.fromX - fromX, toX: pit.toX - fromX, lipY: pit.lipY }]
        : [];
    }),
    props: whole.props
      .filter((prop) => prop.x >= fromX && prop.x < toX)
      .map((prop, index) => {
        const rebased: SchlonicProp = { ...prop, index, x: prop.x - fromX };

        return prop.toX === undefined ? rebased : { ...rebased, toX: prop.toX - fromX };
      }),
    goalX: legWidth
  };
};

/** Every wing the zone holds, at what it is worth: what a perfect run would come home with. */
export const resolveSchlonicWingTotal = (zone: SchlonicZone): number => {
  return zone.props.reduce((total, prop) => total + (prop.kind === "wing" ? (prop.worth ?? 1) : 0), 0);
};

/** Where the finale begins: the post is `SCHLONIC_FINALE_CHUNKS` chunks off from here. */
export const resolveSchlonicFinaleX = (zone: SchlonicZone): number => {
  return zone.goalX - SCHLONIC_FINALE_CHUNKS * SCHLONIC_WORLD.chunkWidth;
};

/**
 * How long a run can possibly last: even crawling at the floor speed the whole way, the post is
 * long behind by here, so a frame still `running` at the cap is a bug, not a patient player.
 */
export const resolveSchlonicTickCap = (zone: SchlonicZone): number => {
  return Math.ceil(zone.goalX / SCHLONIC_WORLD.minSpeed) + SCHLONIC_WORLD.tickHz * 4;
};
