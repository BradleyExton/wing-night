import type { SchlonicPit, SchlonicProp, SchlonicZone, SchlonicZoneCourse } from "../types.js";
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
   * The finale's hole, before the post: wider than a tap clears, so it takes the springboard in
   * front of it or a held jump off the lip — and the springboard is where the arc of high-line
   * wings hangs.
   */
  finalePitWidth: 34,
  /** A wing hung at least this far above the ground is on the high line, and worth two. */
  highLineAbove: 20,
  highLineWorth: 2,
  /** The high line's wings are drawn and reached this much bigger, so what you see is what you hit. */
  highLineWingScale: 1.35,
  /** How far below the lip counts as being in the hole rather than over it. */
  pitLipTolerance: 3,
  tickHz: 60,
  gravity: 0.115,
  /** Gravity while the button is still down and the runner is still going up: the held jump. */
  holdGravityShare: 0.62,
  jumpVelocity: -1.95,
  maxFallVelocity: 3.2,
  /** What the legs can do on the flat. Downhill beats it; the drag bleeds it back afterwards. */
  topSpeed: 1.35,
  acceleration: 0.016,
  drag: 0.006,
  /** A downhill's gradient is worth this much speed a tick; an uphill costs the same. */
  slopeAcceleration: 0.052,
  /** However badly it goes, the runner never comes to a stop — the room would be waiting. */
  minSpeed: 0.34,
  wingRadius: 2.6,
  spikeHeight: 6.5,
  spikeWidth: 14,
  badnikHeight: 10,
  badnikWidth: 9,
  springHeight: 8,
  springWidth: 9,
  /** What a springboard is for: the high wing line, which the legs alone cannot reach. */
  springVelocity: -3.4,
  /**
   * A grind rail stands this far over level ground: just under a tap's peak (the feet top out
   * about 17.5 up), so a tap timed right comes down on it — and just over the rider's head (the
   * hen on its board stands about 14 tall, its tube hangs 1.7 under this line), so a bird that
   * stays on the street rolls clean under the bar rather than looking speared by it. It runs most of its chunk, longer than a hop's whole arc, so a
   * hop can only sweep the end of the line strung along it and the grind is the one way to take
   * all of it.
   */
  railAbove: 16.5,
  railLength: 48,
  /**
   * A rail has no slope and no drag, so the board keeps the speed it arrived with — up to this.
   * Nothing in a zone arrives near it (a runner tops out around 1.4); it is there so a rail can
   * never be where the sim runs away with itself.
   */
  grindMaxSpeed: 2.2,
  /** Popping a badnik bounces the runner back up, and pays. */
  badnikBounceVelocity: -1.7,
  badnikWings: 3,
  /** A hit costs half the handful, knocks the runner back, and buys this long to recover. */
  invulnerableTicks: 70,
  hitSpeedShare: 0.45,
  hitBounceVelocity: -1.1
} as const;

/**
 * The kit a zone is built from, in two piles. The hard kit asks something of the player; the
 * soft kit is the running room between, where the speed and the greedy lines live.
 */
const HARD_KINDS = ["pit", "spikes", "badnik", "spring", "rail"] as const;
const SOFT_KINDS = ["flat", "hill", "dip", "rise", "drop"] as const;

/**
 * The finale: the chunk before the last, on every zone. A springboard, then a hole wider than a
 * tap clears, then the post. The last ten seconds of a run are the loudest thing in it, not the
 * coast they used to be, and the biggest arc of the zone hangs in the spring's flight.
 */
const FINALE_KIND = "finale" as const;

type ChunkKind = (typeof HARD_KINDS)[number] | (typeof SOFT_KINDS)[number] | typeof FINALE_KIND;

/** Where the finale's kit stands inside its chunk. */
const FINALE_SPRING_AT = 8;
const FINALE_PIT_AT = 22;
/** Where the rail starts inside its chunk; the thorn bed stands under its far end. */
const RAIL_AT = 4;
/** How many wings ride the rail, and how far in from its start the first one hangs. */
const RAIL_WINGS = 6;
const RAIL_LINE_INSET = 2;
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
const resolveChunkKinds = (random: () => number, chunks: number): ChunkKind[] => {
  const kinds: ChunkKind[] = [];
  // The hard kit rotates rather than rolls, from a seeded starting point: over a zone every team
  // meets each of the five about equally often. Rolling each slot independently is how a seed
  // ends up with six spike strips and not one pit, and the zone is a rule — the whole round runs
  // the one it drew.
  let hardCursor = Math.floor(random() * HARD_KINDS.length);

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

  return kinds;
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
};

const addProp = (
  placer: PropPlacer,
  kind: SchlonicProp["kind"],
  x: number,
  y: number
): void => {
  placer.props.push({ index: placer.props.length, kind, x, y });
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

  if (kind === "spikes") {
    const spikeX = chunkX + 24;

    addProp(placer, "spike", spikeX, groundAt(placer.heights, placer.pits, spikeX));
    addWingArc(placer, spikeX - 4, 3, 16);
    addWingRun(placer, chunkX + 44, 2, 9);
    return;
  }

  if (kind === "badnik") {
    const badnikX = chunkX + 32;

    addProp(placer, "badnik", badnikX, groundAt(placer.heights, placer.pits, badnikX));
    addWingRun(placer, chunkX + 6, 2, 9);
    addWingArc(placer, badnikX - 6, 3, 18);
    return;
  }

  if (kind === "spring") {
    const springX = chunkX + 22;

    addProp(placer, "spring", springX, groundAt(placer.heights, placer.pits, springX));

    // The payoff hangs where only the spring reaches: a column climbing away from the pad.
    for (let step = 0; step < 4; step += 1) {
      const x = springX + 6 + step * 9;
      const ground = groundAt(placer.heights, placer.pits, x);
      const above = 22 + step * 7;

      addWing(placer, x, Math.max(6, ground - above), resolveWingWorth(above));
    }

    addWingRun(placer, chunkX + 44, 2, 9);
    return;
  }

  if (kind === "rail") {
    const { railLength, railAbove, runnerRadius, wingRadius, highLineWorth } = SCHLONIC_WORLD;
    const railX = chunkX + RAIL_AT;
    const toX = railX + railLength;
    const ground = groundAt(placer.heights, placer.pits, railX);
    const railY = ground - railAbove;

    // The thorns wait under the rail's far end: a bird that stayed on the floor meets them late,
    // and a hop over them leaves the ground too late to sweep more than the tail of the line.
    addProp(placer, "spike", toX, ground);
    placer.props.push({ index: placer.props.length, kind: "rail", x: railX, toX, y: railY });

    // The greedy line rides the rail, just over its top, evenly from its near end to where the
    // thorns begin: a grinding bird's body passes through every wing and a walking one's reaches
    // none. Worth two however low it hangs, because only the grind collects the lot — a hop over
    // the thorns leaves the ground a stride short of them and sweeps the last two.
    const lineFrom = railX + RAIL_LINE_INSET;
    const lineTo = toX - SCHLONIC_WORLD.spikeWidth / 2 + 1;

    for (let step = 0; step < RAIL_WINGS; step += 1) {
      const x = lineFrom + ((lineTo - lineFrom) * step) / (RAIL_WINGS - 1);

      addWing(placer, x, railY - runnerRadius - wingRadius, highLineWorth);
    }

    // The floor line under the rail's near end, for whoever stays down: what the grind gives up.
    addWingRun(placer, chunkX + 12, 2, 9);
    return;
  }

  if (kind === FINALE_KIND) {
    const springX = chunkX + FINALE_SPRING_AT;

    addProp(placer, "spring", springX, groundAt(placer.heights, placer.pits, springX));
    // The biggest arc in the zone, over the hole, where the spring throws you: five on the
    // high line, and a low line under them for whoever jumps it off the lip instead.
    addWingArc(placer, springX + 8, 5, 28);
    addWingArc(placer, springX + 14, 4, 12);
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

/**
 * One zone, laid out from its seed. Every team in the round runs the same one — the seed is a
 * rule, not a roll — so the night is a race over the same hill rather than a lottery.
 */
export const resolveSchlonicZone = ({ seed, chunks }: SchlonicZoneCourse): SchlonicZone => {
  const random = createMulberry32(seed | 0);
  const kinds = resolveChunkKinds(random, Math.max(3, chunks));
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
  const placer: PropPlacer = { heights, pits, props: [] };

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
