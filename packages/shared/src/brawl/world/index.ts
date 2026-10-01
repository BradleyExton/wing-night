import type { BrawlBlock, BrawlCourse, BrawlGoonKind, BrawlSide, BrawlSpawn, BrawlWave } from "../types.js";
import { createMulberry32, pickInteger } from "../../seededRandom/index.js";

type BrawlGoonStats = {
  hp: number;
  worth: number;
  halfWidth: number;
  height: number;
  /** Units a tick walking in and closing on the hen. */
  speed: number;
  /** The distance, centre to centre, at which it stops closing and starts the honk. */
  reach: number;
  telegraphTicks: number;
  attackTicks: number;
  recoverTicks: number;
  stunTicks: number;
  /** How far a peck that does not finish it shoves it. */
  knockback: number;
  /**
   * Units a tick through the attack. An attack only hurts by the goon's own box overlapping the
   * hen's, so it has to travel: from `reach` away, through her, and out the other side — which
   * is what makes a goon behind a mashing hen end up in front of her beak, a heart later.
   */
  lunge: number;
};

/**
 * The gull's cruising height, its dive's floor, and the pull that bends the dive back up. The
 * dive is a parabola stepped by `vy += gravity` — never a sine — sized so a dive of the gull's
 * `attackTicks` bottoms out at `diveFloor` and comes back to `cruiseY` on its last tick.
 */
const GULL_CRUISE_Y = 30;
const GULL_DIVE_FLOOR = 2;
const GULL_ATTACK_TICKS = 40;

/**
 * The fixed geometry and tuning every block shares. World units are SCHLONIC's: a 160×90 box the
 * renderer maps onto a 16:9 viewport. Unlike SCHLONIC, `y` on a goon is height ABOVE the ground
 * line (a street fight is flat; only the gull leaves it). Speeds are per tick at `tickHz`, so a
 * tick count is a duration on every machine.
 *
 * Tuned against two bots (`simulate/index.test.ts`). A masher who holds right and pecks every
 * ten ticks stands pinned to the camera's right edge with everything from the left at her back:
 * over 200 seeds she clears block 0 about two times in three with a heart or two gone, block 1
 * about one in three, and block 2 about one in twenty, nearly always on her last heart.
 * A brawler who turns to face the nearest goon and pecks in reach clears all three. The levers
 * that set that curve are the peck's rhythm (a ten-tick mash lands every other press, live half
 * the time) and the goons' lunge through her (a goose behind her costs a heart unless the beak
 * happens to be out as it arrives).
 */
export const BRAWL_WORLD = {
  width: 160,
  height: 90,
  groundY: 70,
  tickHz: 60,
  /** The block's own clock: 75 seconds, then the bell. */
  blockTicks: 75 * 60,
  henRadius: 5,
  /** The peck's box is her height tall, and so is the box a goon's attack has to reach. */
  henHeight: 16,
  /** Where the hen stands at the start line. */
  henStartX: 30,
  /** Across the locked screen in under three seconds: a wave is a fight, not a walk. */
  henWalkSpeed: 0.9,
  henMargin: 10,
  /** A peck opens a beat after the press, so the press is a commit the room can see. */
  peckDelayTicks: 4,
  peckActiveTicks: 10,
  /**
   * About four pecks a second at the most: a mash lands at this rate and no faster. Never less
   * than the delay and the live window together, or a press would cut the last peck short.
   */
  peckCooldownTicks: 14,
  /**
   * How far past the front of her box the beak lands. The peck's box runs from her back edge to
   * here: a peck is the whole bird jabbing, so a goon lunging into her back while the beak is
   * out meets it — the one way a bird mashing forward ever answers "BEHIND YOU".
   */
  peckReach: 10,
  hurtTicks: 18,
  /** A second and a half: a goon and the one queued behind it cannot take two hearts in one go. */
  invulnerableTicks: 90,
  hitKnockback: 10,
  heartsMax: 3,
  koFallTicks: 45,
  /** Faster than she walks, so the camera catches up with her between waves. */
  cameraUnlockSpeed: 1.5,
  /**
   * The camera follows the hen once she is past this share of the window, so there is more
   * street ahead of her than behind.
   */
  cameraLeadShare: 0.4,
  /**
   * How close a walking goon will come up behind another one on the same side of the hen. They
   * queue rather than stack, so the TV reads each one, and a beak meets them in turn.
   */
  goonSpacing: 12,
  gullCruiseY: GULL_CRUISE_Y,
  /** How fast a gull that is not diving climbs back to its cruise, and a KO'd one drops. */
  gullClimb: 0.6,
  gullDiveGravity: (8 * (GULL_CRUISE_Y - GULL_DIVE_FLOOR)) / (GULL_ATTACK_TICKS * GULL_ATTACK_TICKS),
  goons: {
    goose: {
      hp: 1,
      worth: 1,
      halfWidth: 5,
      height: 14,
      speed: 0.5,
      reach: 14,
      telegraphTicks: 30,
      attackTicks: 16,
      recoverTicks: 30,
      stunTicks: 24,
      knockback: 8,
      lunge: 2
    },
    gull: {
      hp: 1,
      worth: 1,
      halfWidth: 5,
      height: 8,
      speed: 0.7,
      reach: 24,
      telegraphTicks: 24,
      attackTicks: GULL_ATTACK_TICKS,
      recoverTicks: 30,
      stunTicks: 20,
      knockback: 6,
      lunge: 1.2
    },
    raccoon: {
      hp: 2,
      worth: 2,
      halfWidth: 6,
      height: 10,
      speed: 0.6,
      reach: 32,
      telegraphTicks: 36,
      attackTicks: 36,
      recoverTicks: 40,
      stunTicks: 24,
      knockback: 10,
      // The charge: twice its walking speed, from well out of beak range to well past her.
      lunge: 1.2
    },
    boss: {
      hp: 4,
      worth: 4,
      halfWidth: 8,
      height: 22,
      speed: 0.45,
      // A goose with twice the neck.
      reach: 28,
      telegraphTicks: 36,
      attackTicks: 20,
      recoverTicks: 40,
      // It shrugs a peck off faster and further forward than a goose does.
      stunTicks: 12,
      knockback: 5,
      lunge: 2.4
    }
  } satisfies Record<BrawlGoonKind, BrawlGoonStats>
} as const;

/** The box a goon stands in: `halfWidth` either side of its x, `height` up from its y. */
export const resolveBrawlGoonBox = (kind: BrawlGoonKind): { halfWidth: number; height: number } => {
  const { halfWidth, height } = BRAWL_WORLD.goons[kind];

  return { halfWidth, height };
};

/** The block's tick cap: 75 seconds, the same for every block, so the clock line is one number. */
export const resolveBrawlTickCap = (): number => BRAWL_WORLD.blockTicks;

/**
 * A wave's goons before they are dealt: how many walk on, and how many of those are gulls and
 * raccoons. The mix is a rule and only the order is dealt, so no seed hands one team a sky full
 * of gulls in the easy block (SCHLONIC deals its hard kit the same way).
 */
type WaveShape = { size: number; gulls: number; raccoons: number; boss: boolean };

/**
 * The difficulty curve, in waves. Block 0 is three geese and then four with a gull among them
 * (the first gate is the easy one, principles §5 and §18); block 1 adds a wave's worth and a
 * raccoon; block 2 is three waves closing on the boss. Past block 2 the same shape, one goose
 * more a wave for every block beyond it.
 */
const resolveWaveShapes = (blockIndex: number): WaveShape[] => {
  if (blockIndex === 0) {
    return [
      { size: 3, gulls: 0, raccoons: 0, boss: false },
      { size: 4, gulls: 1, raccoons: 0, boss: false }
    ];
  }

  if (blockIndex === 1) {
    return [
      { size: 4, gulls: 1, raccoons: 0, boss: false },
      { size: 5, gulls: 1, raccoons: 1, boss: false }
    ];
  }

  const extra = blockIndex - 2;

  return [
    { size: 4 + extra, gulls: 1, raccoons: 1, boss: false },
    { size: 5 + extra, gulls: 2, raccoons: 1, boss: false },
    { size: 2 + extra, gulls: 1, raccoons: 0, boss: true }
  ];
};

/** The first goon steps in this long after its wave opens: a beat to read the street. */
const WAVE_FIRST_AT = 45;
/** A wave's goons arrive spread over about four seconds. */
const WAVE_SPREAD_TICKS = 240;
const WAVE_JITTER_TICKS = 12;
/** Two goons never step in on the same tick. */
const WAVE_MIN_GAP_TICKS = 6;
/** The boss comes in on its own, a couple of seconds after the last of its escort. */
const BOSS_AFTER_TICKS = 120;

/** The wave's kinds in slot order: its gulls and raccoons dealt into seeded slots, geese in the rest. */
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

  return kinds;
};

/**
 * Sides alternate from a seeded start, and from the third goon on one in four keeps the side of
 * the one before — so no wave arrives from one side only (the first two always differ), and no
 * wave is a metronome either.
 */
const dealSide = (random: () => number, slot: number, previous: BrawlSide | null): BrawlSide => {
  if (previous === null) {
    return random() < 0.5 ? -1 : 1;
  }

  if (slot >= 2 && pickInteger(random, 0, 3) === 0) {
    return previous;
  }

  return previous === 1 ? -1 : 1;
};

const dealWave = (random: () => number, shape: WaveShape, index: number, firstSpawnIndex: number): BrawlWave => {
  const kinds = dealKinds(random, shape);
  const spawns: BrawlSpawn[] = [];
  let side: BrawlSide | null = null;
  let atTick = 0;

  for (let slot = 0; slot < shape.size; slot += 1) {
    const kind = kinds[slot] ?? "goose";
    const spread = shape.size > 1 ? Math.floor((slot * WAVE_SPREAD_TICKS) / (shape.size - 1)) : 0;
    const jitter = slot === 0 ? 0 : pickInteger(random, -WAVE_JITTER_TICKS, WAVE_JITTER_TICKS);

    side = dealSide(random, slot, side);
    atTick = Math.max(slot === 0 ? 0 : atTick + WAVE_MIN_GAP_TICKS, WAVE_FIRST_AT + spread + jitter);
    spawns.push({ index: firstSpawnIndex + slot, kind, side, atTick });
  }

  if (shape.boss) {
    spawns.push({
      index: firstSpawnIndex + shape.size,
      kind: "boss",
      side: random() < 0.5 ? -1 : 1,
      atTick: atTick + BOSS_AFTER_TICKS
    });
  }

  return { index, lockX: index * BRAWL_WORLD.width, spawns };
};

/** Which block a course picks: the first of one unless it says, clamped to the course. */
const resolveCourseBlock = ({ blocks = 1, block = 0 }: BrawlCourse): number => {
  const count = Math.max(1, Math.floor(blocks));

  return Math.max(0, Math.min(count - 1, Math.floor(block)));
};

/**
 * One block of the street, laid out from the course's seed. Each block draws from its own
 * stream (the seed mixed with the block's index), so block 2 is the same street whether the
 * course is three blocks long or five, and every team in the round fights the same one: the
 * seed is a rule, not a roll.
 */
export const resolveBrawlBlock = (course: BrawlCourse): BrawlBlock => {
  const blockIndex = resolveCourseBlock(course);
  const random = createMulberry32((course.seed ^ Math.imul(blockIndex + 1, 0x9e3779b9)) | 0);
  const waves: BrawlWave[] = [];
  let spawnCount = 0;

  resolveWaveShapes(blockIndex).forEach((shape, index) => {
    const wave = dealWave(random, shape, index, spawnCount);

    waves.push(wave);
    spawnCount += wave.spawns.length;
  });

  const spawns = waves.flatMap((wave) => wave.spawns);
  const length = (waves.length + 1) * BRAWL_WORLD.width;

  return {
    index: blockIndex,
    length,
    waves,
    handoffX: length - BRAWL_WORLD.henMargin * 3,
    spawns,
    goonsTotal: spawns.reduce((total, spawn) => total + BRAWL_WORLD.goons[spawn.kind].worth, 0)
  };
};

/** What the whole course is worth: every block's goons, the number the team's worth is put over. */
export const resolveBrawlCourseTotal = (course: { seed: number; blocks: number }): number => {
  const blocks = Math.max(1, Math.floor(course.blocks));
  let total = 0;

  for (let block = 0; block < blocks; block += 1) {
    total += resolveBrawlBlock({ seed: course.seed, blocks, block }).goonsTotal;
  }

  return total;
};
