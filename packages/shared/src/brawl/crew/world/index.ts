import type { BrawlGoonKind, BrawlHazard, BrawlHazardKind, BrawlSide } from "../../types.js";
import { BRAWL_WORLD } from "../../world/index.js";
import { createMulberry32, pickInteger } from "../../../seededRandom/index.js";
import type { BrawlCrewBlock, BrawlCrewCourse, BrawlCrewSpawn, BrawlCrewWalk, BrawlCrewWave } from "../types.js";

/**
 * The crew's street (docs/minigames/brawl-crew-spec.md §0.4). Everything the relay's world says
 * about a hen's peck, a hit and each goon's own numbers still holds and is read from
 * `BRAWL_WORLD`; what is here is what depth and a crew change. Speeds are per tick at `tickHz`.
 */
export const BRAWL_CREW_WORLD = {
  ...BRAWL_WORLD,
  /** The one window: the wall's. Wider and taller than the relay's so a crew and its geese fit. */
  width: 192,
  height: 108,
  /** The walkable band: z is 0 at the back and `depth` nearest the camera. */
  depth: 32,
  /** Where slot 0 stands at the start line; the rest fan out behind and across (`resolveBrawlCrewHenStart`). */
  henStartX: 34,
  /** A goon is born this far past the window's edge (plus its own half-width) and walks in. */
  spawnLead: 4,
  /** Up and down the band she moves at 70% of her walk: the street is long, not deep. */
  henDepthSpeed: 0.63,
  /**
   * A diagonal's two components, fixed: `henWalkSpeed` and `henDepthSpeed` each over √2, rounded
   * once here so the sim never takes a square root.
   */
  henDiagonalX: 0.64,
  henDiagonalZ: 0.45,
  /** She still drifts while the beak is out, at this share of her speed: a peck is a commit. */
  peckWalkShare: 0.4,
  /** A peck lands on a goon within this much depth of her line: about her own height in all. */
  peckDepthBand: 7,
  /** A press during the cooldown or a reel still pecks if it can open within this long. */
  peckBufferTicks: 10,
  /**
   * A thumb left down pecks again this long after the cooldown would have let a fresh press: the
   * relay's "a mash lands every other press", for a pad that repeats by itself. Holding is the
   * floor and is live half the time; pressing in time with the cooldown is a little better.
   */
  peckHoldRestTicks: 6,
  /** Units a tick she slides toward the line of the goon her peck is for. */
  alignSpeed: 1.2,
  /** A lunge hurts a hen within this of the goon's line, and a goon honks from within it of hers. */
  goonHitBand: 4,
  goonLineBand: 4,
  /** How far past its reach a goon holds while it gets onto her line. */
  goonStandoff: 8,
  /** A goon crosses the band at this share of its walking speed. */
  goonLineSpeedShare: 0.8,
  /** Walkers queue behind one another only when their lines are this close. */
  goonQueueBand: 6,
  /** A second and a half of a teammate standing over her gets a downed hen up, on one heart. */
  reviveTicks: 90,
  reviveReach: 12,
  reviveHearts: 1,
  /** Ten seconds with the pad neutral and silent: she sits down and the geese leave her alone. */
  awayTicks: 10 * 60,
  /** The block's own clock: 90 seconds, then the bell. More geese than the relay's 75 allowed for. */
  blockTicks: 90 * 60,
  /** How long an event stays in the frame: two seconds, long enough for any screen to have rung it. */
  eventWindowTicks: 120,
  /**
   * Each hen past the first adds this share of a wave's relay count to it, rounded up: 3/5, so
   * block 0's first wave is 3, 5, 7, 9, 11 goons for a crew of one to five. A ratio of integers,
   * so the count is exact on every machine.
   */
  crewShareNumerator: 3,
  crewShareDenominator: 5,
  /** At most this many goons stand on the street at once, plus one a hen. */
  standingBase: 2,
  /** The boss has its relay hp, plus this for each hen past the first. */
  bossHpPerHen: 2,
  /** A crew is never dealt for more than this many: a roster of eight is the biggest the night seats. */
  maxCrew: 8
} as const;

/**
 * Each stick direction as a step: which way along the street, which way across it, and whether it
 * is a diagonal (and so takes the two diagonal components).
 */
export const BRAWL_CREW_WALKS: Record<BrawlCrewWalk, { x: -1 | 0 | 1; z: -1 | 0 | 1 }> = {
  0: { x: 0, z: 0 },
  1: { x: 1, z: 0 },
  2: { x: 1, z: 1 },
  3: { x: 0, z: 1 },
  4: { x: -1, z: 1 },
  5: { x: -1, z: 0 },
  6: { x: -1, z: -1 },
  7: { x: 0, z: -1 },
  8: { x: 1, z: -1 }
};

/** A crew's size as the street is furnished for it: a whole number from one to `maxCrew`. */
export const resolveBrawlCrewSize = (crew: number | undefined): number => {
  return Math.max(1, Math.min(BRAWL_CREW_WORLD.maxCrew, Math.floor(crew ?? 1)));
};

/** Where a hen stands when a block starts: slots fan across the band, three to a column. */
export const resolveBrawlCrewHenStart = (slot: number, crew: number): { x: number; z: number } => {
  const { henStartX, depth, henMargin } = BRAWL_CREW_WORLD;
  const column = Math.floor(slot / 3);
  const rows = Math.min(3, crew - column * 3);
  const row = slot % 3;

  return {
    x: Math.max(henMargin, henStartX - column * 14),
    z: Math.floor((depth * (row + 1)) / (rows + 1))
  };
};

/** The box a goon stands in: `halfWidth` either side of its x, `height` up from the street. */
export const resolveBrawlCrewGoonStats = (kind: BrawlGoonKind) => BRAWL_CREW_WORLD.goons[kind];

type WaveShape = { size: number; gulls: number; raccoons: number; swans: number; helmets: number; boss: boolean };

/**
 * The relay's difficulty curve, in waves, for one hen (`../../world`: block 0 is geese and then a
 * gull, block 1 brings the swan and the raccoon, block 2 closes on the boss with the helmet goose
 * either side). The crew's kit is this, scaled.
 */
const resolveRelayShapes = (blockIndex: number): WaveShape[] => {
  const wave = (size: number, kit: Partial<Omit<WaveShape, "size">> = {}): WaveShape => ({
    size,
    gulls: 0,
    raccoons: 0,
    swans: 0,
    helmets: 0,
    boss: false,
    ...kit
  });

  if (blockIndex === 0) {
    return [wave(3), wave(4, { gulls: 1 })];
  }

  if (blockIndex === 1) {
    return [wave(4, { gulls: 1, swans: 1 }), wave(5, { gulls: 1, raccoons: 1 })];
  }

  const extra = blockIndex - 2;

  return [
    wave(4 + extra, { gulls: 1, raccoons: 1, helmets: 1 }),
    wave(5 + extra, { gulls: 2, raccoons: 1, swans: 1 }),
    wave(2 + extra, { gulls: 1, helmets: 1, boss: true })
  ];
};

/**
 * One wave, furnished for the crew: every hen past the first adds 3/5 of the relay's count,
 * rounded up, and the special goons come one more of each for every two hens. Still one boss.
 */
const scaleShape = (shape: WaveShape, crew: number): WaveShape => {
  const { crewShareNumerator, crewShareDenominator } = BRAWL_CREW_WORLD;
  const pairs = Math.ceil(crew / 2);

  return {
    size: shape.size + Math.ceil((shape.size * crewShareNumerator * (crew - 1)) / crewShareDenominator),
    gulls: shape.gulls * pairs,
    raccoons: shape.raccoons * pairs,
    swans: shape.swans * pairs,
    helmets: shape.helmets * pairs,
    boss: shape.boss
  };
};

const WAVE_FIRST_AT = 45;
/** A wave's goons are due over about four seconds whatever its size; the standing cap paces the rest. */
const WAVE_SPREAD_TICKS = 240;
const WAVE_JITTER_TICKS = 12;
const WAVE_MIN_GAP_TICKS = 6;
const BOSS_AFTER_TICKS = 120;
/** How far in from the band's back and front a goon's line is dealt. */
const LINE_MARGIN = 2;

/** The wave's kinds in slot order: the special goons dealt into seeded slots, geese in the rest. */
const dealKinds = (random: () => number, shape: WaveShape): BrawlGoonKind[] => {
  const kinds: BrawlGoonKind[] = Array.from({ length: shape.size }, () => "goose");
  const deal = (kind: BrawlGoonKind, count: number): void => {
    let dealt = 0;

    while (dealt < count && kinds.includes("goose")) {
      const slot = pickInteger(random, 0, shape.size - 1);

      if (kinds[slot] === "goose") {
        kinds[slot] = kind;
        dealt += 1;
      }
    }
  };

  deal("raccoon", shape.raccoons);
  deal("gull", shape.gulls);
  deal("helmet", shape.helmets);
  deal("swan", shape.swans);

  return kinds;
};

/** Sides alternate from a seeded start, and from the third goon on one in four keeps the last side. */
const dealSide = (random: () => number, slot: number, previous: BrawlSide | null): BrawlSide => {
  if (previous === null) {
    return random() < 0.5 ? -1 : 1;
  }

  if (slot >= 2 && pickInteger(random, 0, 3) === 0) {
    return previous;
  }

  return previous === 1 ? -1 : 1;
};

const dealLine = (random: () => number): number => {
  return pickInteger(random, LINE_MARGIN, BRAWL_CREW_WORLD.depth - LINE_MARGIN);
};

const dealWave = (random: () => number, shape: WaveShape, index: number, firstSpawnIndex: number): BrawlCrewWave => {
  const kinds = dealKinds(random, shape);
  const spawns: BrawlCrewSpawn[] = [];
  let side: BrawlSide | null = null;
  let atTick = 0;

  for (let slot = 0; slot < shape.size; slot += 1) {
    const kind = kinds[slot] ?? "goose";
    const spread = shape.size > 1 ? Math.floor((slot * WAVE_SPREAD_TICKS) / (shape.size - 1)) : 0;
    const jitter = slot === 0 ? 0 : pickInteger(random, -WAVE_JITTER_TICKS, WAVE_JITTER_TICKS);

    side = dealSide(random, slot, side);
    atTick = Math.max(slot === 0 ? 0 : atTick + WAVE_MIN_GAP_TICKS, WAVE_FIRST_AT + spread + jitter);
    spawns.push({ index: firstSpawnIndex + slot, kind, side, atTick, z: dealLine(random) });
  }

  if (shape.boss) {
    spawns.push({
      index: firstSpawnIndex + shape.size,
      kind: "boss",
      side: random() < 0.5 ? -1 : 1,
      atTick: atTick + BOSS_AFTER_TICKS,
      z: Math.floor(BRAWL_CREW_WORLD.depth / 2)
    });
  }

  return { index, lockX: index * BRAWL_CREW_WORLD.width, spawns };
};

const resolveHazardKind = (blockIndex: number): BrawlHazardKind => {
  if (blockIndex === 0) {
    return "railing";
  }

  return blockIndex === 1 ? "bay" : "plinth";
};

const HAZARD_EDGE_CLEARANCE = 14;

/**
 * The block's hazard, dealt after its waves so it never moves a goon: in wave 1's window, in its
 * left or right third, clear of the edges goons walk in from. It spans the whole depth of the
 * band, so shoving a goon into it is still a question of left and right.
 */
const dealHazard = (random: () => number, blockIndex: number, waves: readonly BrawlCrewWave[]): BrawlHazard | null => {
  const window = waves[1];

  if (window === undefined) {
    return null;
  }

  const { width, hazardWidth } = BRAWL_CREW_WORLD;
  const third = Math.floor(width / 3);
  const isRight = random() < 0.5;
  const from = isRight ? width - third : HAZARD_EDGE_CLEARANCE;
  const to = isRight ? width - HAZARD_EDGE_CLEARANCE - hazardWidth : third - hazardWidth;

  return { kind: resolveHazardKind(blockIndex), x: window.lockX + pickInteger(random, from, to), width: hazardWidth };
};

const resolveCourseBlock = ({ blocks = 1, block = 0 }: BrawlCrewCourse): number => {
  const count = Math.max(1, Math.floor(blocks));

  return Math.max(0, Math.min(count - 1, Math.floor(block)));
};

/**
 * One block of the street, furnished for the crew and laid out from the course's seed. Each block
 * draws from its own stream, so block 2 is the same street on a three-block course and a
 * five-block one. A crew of a different size is a different deal of the same rule — more goons to
 * place — which is why the block names the crew it was dealt for.
 */
export const resolveBrawlCrewBlock = (course: BrawlCrewCourse): BrawlCrewBlock => {
  const blockIndex = resolveCourseBlock(course);
  const crew = resolveBrawlCrewSize(course.crew);
  const random = createMulberry32((course.seed ^ Math.imul(blockIndex + 1, 0x9e3779b9)) | 0);
  const waves: BrawlCrewWave[] = [];
  let spawnCount = 0;

  resolveRelayShapes(blockIndex).forEach((shape, index) => {
    const wave = dealWave(random, scaleShape(shape, crew), index, spawnCount);

    waves.push(wave);
    spawnCount += wave.spawns.length;
  });

  const spawns = waves.flatMap((wave) => wave.spawns);
  const length = (waves.length + 1) * BRAWL_CREW_WORLD.width;
  const { cleanWaveBonus, heartsMax, heartWorth, standingBase, bossHpPerHen, goons, henMargin } = BRAWL_CREW_WORLD;
  const goonsWorth = spawns.reduce((total, spawn) => total + goons[spawn.kind].worth, 0);

  return {
    index: blockIndex,
    crew,
    length,
    waves,
    exitX: length - henMargin * 3,
    spawns,
    hazard: dealHazard(random, blockIndex, waves),
    standingCap: standingBase + crew,
    bossHp: goons.boss.hp + bossHpPerHen * (crew - 1),
    total: goonsWorth + waves.length * cleanWaveBonus * crew + heartsMax * heartWorth * crew
  };
};

/** What a whole course is worth to a crew of one size: the number its banked worth is put over. */
export const resolveBrawlCrewCourseTotal = (course: { seed: number; blocks: number; crew: number }): number => {
  const blocks = Math.max(1, Math.floor(course.blocks));
  let total = 0;

  for (let block = 0; block < blocks; block += 1) {
    total += resolveBrawlCrewBlock({ seed: course.seed, blocks, block, crew: course.crew }).total;
  }

  return total;
};
