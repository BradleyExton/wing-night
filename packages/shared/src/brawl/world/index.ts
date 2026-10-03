import type {
  BrawlBlock,
  BrawlCourse,
  BrawlGoon,
  BrawlGoonKind,
  BrawlHazard,
  BrawlHazardKind,
  BrawlOutcome,
  BrawlSide,
  BrawlSpawn,
  BrawlWave
} from "../types.js";
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
 * Tuned against three bots (`simulate/index.test.ts`). A masher who holds right and pecks every
 * ten ticks stands pinned to the camera's right edge with everything from the left at her back:
 * over 200 seeds she clears block 0 two times in three with a heart or two gone, block 1 about
 * two in five, and block 2 about one in fourteen, nearly always on her last heart. A turner — the
 * same mash, but holding toward the nearest goon so she faces it — clears 91%, 73% and 47%. A
 * brawler who turns to face the nearest goon, pecks in reach and waits out a helmet goose's guard
 * clears all three. The levers that set that curve are the peck's rhythm (a ten-tick mash lands
 * every other press, live half the time) and the goons' lunge through her (a goose behind her
 * costs a heart unless the beak happens to be out as it arrives).
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
  /**
   * How far past the tablet's edge a goon steps onto the street, so it is already walking when
   * it comes into view rather than appearing at the edge. The TV's camera is wider than the
   * tablet's on both sides (the scene's `TV_CAMERA_FIT`), and the wall's own margin — 13 to 20
   * units a side at a TV's aspect — is what the room sees first: about half a second of goose
   * before the holder's frame has it, from behind as much as from ahead. The room is the hen's
   * lookout, and "BEHIND YOU" is the team's job (docs/minigames/brawl-spec.md §3). At goose
   * speed this lead is a second of walking in.
   */
  spawnLead: 30,
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
  /**
   * What a clean wave banks: a wave taken down with no hit on her since it opened. A thing to
   * lose in every wave with no new input (docs/research/brawl-depth-and-strategy.md, feature 1);
   * INSIDE the course's total, so a perfect block is still "everything down" and no more.
   */
  cleanWaveBonus: 2,
  /**
   * What each heart she walks off a CLEARED block with is worth to the team: the first
   * teammate's clean block reaches the last one, and the relay is a pot (feature 3). The bay and
   * the bell bank no hearts. Banked by the runtime off the refereed result, never by the sim.
   */
  heartWorth: 1,
  /**
   * How long a dropped wing lies on the pavement: six seconds, then it is gone. A goon worth two
   * or more leaves one where it went down (one a wave, one on the street at a time), and the hen
   * eats it by STANDING (thumb up) within `henRadius + wingReach` of it — a heart back, up to the cap
   * (`resolveBrawlHeartsCap`). At full hearts she walks over it and it stays.
   */
  wingTicks: 6 * 60,
  wingReach: 3,
  /** How wide each block's hazard is (the railing, the bay's edge, the plinth). */
  hazardWidth: 24,
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
    // The swan: SoR2's Signal. Bigger and slower than a goose, and it only lunges at a hen facing
    // away from it — faced, it `stalk`s at its reach and waits, so a turn is always the answer.
    swan: {
      hp: 1,
      worth: 2,
      halfWidth: 6,
      height: 18,
      speed: 0.35,
      reach: 18,
      telegraphTicks: 30,
      attackTicks: 18,
      recoverTicks: 36,
      stunTicks: 24,
      knockback: 6,
      lunge: 2.2
    },
    // The helmet goose: SoR2's Donovan. A goose's box and script, but its guard is down while it
    // walks and reels, so a peck then clanks off (`isBrawlGoonGuarded`). Peck it into the honk.
    helmet: {
      hp: 1,
      worth: 2,
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
 * The hearts a block starts with: three, or four when the team bought a heart at the handoff
 * (docs/minigames/brawl-spec.md §0.3, "The handoff pick"). One function, so the referee, the
 * tablet's runner, the TV's mirror and both chromes' heart rows all count the same.
 */
export const resolveBrawlStartHearts = (heartBought: boolean): number => {
  return BRAWL_WORLD.heartsMax + (heartBought ? 1 : 0);
};

/**
 * The most hearts she can hold: what a wing restores up to — the hearts the block started with,
 * so a bought fourth heart can be eaten back and a block that kept the three tops out at three.
 */
export const resolveBrawlHeartsCap = (block: Pick<BrawlBlock, "hearts">): number => block.hearts;

/** The states a helmet goose's guard is UP in: the honk, the lunge and the slump after it. */
const GUARD_UP_STATES: readonly BrawlGoon["state"][] = ["telegraph", "attack", "recover"];

/**
 * Whether a peck landing on this goon now would clank off its guard: a helmet goose that is not
 * honking, lunging or spent. The answer is to peck into the honk or after the lunge. The drawing
 * flips the cage on the same states (`data-brawl-goon-guard`).
 */
export const isBrawlGoonGuarded = (goon: Pick<BrawlGoon, "kind" | "state">): boolean => {
  return goon.kind === "helmet" && !GUARD_UP_STATES.includes(goon.state);
};

/**
 * A wave's goons before they are dealt: how many walk on, and how many of those are gulls,
 * raccoons, swans and helmet geese. The mix is a rule and only the order is dealt, so no seed
 * hands one team a sky full of gulls in the easy block (SCHLONIC deals its hard kit the same way).
 */
type WaveShape = { size: number; gulls: number; raccoons: number; swans: number; helmets: number; boss: boolean };

/**
 * The difficulty curve, in waves. Block 0 is three geese and then four with a gull among them
 * (the first gate is the easy one, principles §5 and §18); block 1 brings the swan in its first
 * wave and the raccoon in its second; block 2 is three waves closing on the boss, with the helmet
 * goose in the first and last and a swan in the middle. Past block 2 the same shape, one goose
 * more a wave for every block beyond it.
 */
const resolveWaveShapes = (blockIndex: number): WaveShape[] => {
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

/** The first goon steps in this long after its wave opens: a beat to read the street. */
const WAVE_FIRST_AT = 45;
/** A wave's goons arrive spread over about four seconds. */
const WAVE_SPREAD_TICKS = 240;
const WAVE_JITTER_TICKS = 12;
/** Two goons never step in on the same tick. */
const WAVE_MIN_GAP_TICKS = 6;
/** The boss comes in on its own, a couple of seconds after the last of its escort. */
const BOSS_AFTER_TICKS = 120;

/** The wave's kinds in slot order: its gulls, raccoons, helmets and swans dealt into seeded slots, geese in the rest. */
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

/** Which hazard a block's setting carries: Dunlop's railing, the waterfront's bay, the beach's plinth. */
const resolveHazardKind = (blockIndex: number): BrawlHazardKind => {
  if (blockIndex === 0) {
    return "railing";
  }

  return blockIndex === 1 ? "bay" : "plinth";
};

/**
 * How far in from either edge of wave 1's window the hazard stays: clear of where a goon steps in
 * (half a body inside the edge) and of the hen's margin, so nothing is born into it.
 */
const HAZARD_EDGE_CLEARANCE = 14;

/**
 * The block's hazard, dealt AFTER its waves so it never moves a goon: in wave 1's window, never
 * wave 0's (the first wave of a block is a fight, not a puzzle — principles §18), in its left or
 * right third. The hen walks into a wave's window at about 40% of it (`cameraLeadShare`), so a
 * hazard in either outer third is never under her when the wave opens, and the clearance keeps it
 * off the edges the goons walk in from.
 */
const dealHazard = (random: () => number, blockIndex: number, waves: readonly BrawlWave[]): BrawlHazard | null => {
  const window = waves[1];

  if (window === undefined) {
    return null;
  }

  const { width, hazardWidth } = BRAWL_WORLD;
  const third = Math.floor(width / 3);
  const isRight = random() < 0.5;
  const from = isRight ? width - third : HAZARD_EDGE_CLEARANCE;
  const to = isRight ? width - HAZARD_EDGE_CLEARANCE - hazardWidth : third - hazardWidth;

  return { kind: resolveHazardKind(blockIndex), x: window.lockX + pickInteger(random, from, to), width: hazardWidth };
};

/** Which block a course picks: the first of one unless it says, clamped to the course. */
const resolveCourseBlock = ({ blocks = 1, block = 0 }: BrawlCourse): number => {
  const count = Math.max(1, Math.floor(blocks));

  return Math.max(0, Math.min(count - 1, Math.floor(block)));
};

/** The hearts a course starts its block with: `heartsMax` unless it says, and never fewer than one. */
const resolveCourseHearts = ({ hearts = BRAWL_WORLD.heartsMax }: BrawlCourse): number => {
  return Math.max(1, Math.floor(hearts));
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
  const hazard = dealHazard(random, blockIndex, waves);

  return {
    index: blockIndex,
    length,
    waves,
    handoffX: length - BRAWL_WORLD.henMargin * 3,
    spawns,
    hazard,
    hearts: resolveCourseHearts(course),
    // Every goon's worth, and a clean-wave bonus for every wave: the most the sim itself can bank.
    goonsTotal:
      spawns.reduce((total, spawn) => total + BRAWL_WORLD.goons[spawn.kind].worth, 0) +
      waves.length * BRAWL_WORLD.cleanWaveBonus
  };
};

/** What the hearts of a perfect block are worth on top of its `goonsTotal`: all of them carried off. */
export const resolveBrawlHeartsTotal = (): number => BRAWL_WORLD.heartsMax * BRAWL_WORLD.heartWorth;

/**
 * How many of the hearts she walked off a cleared block with are worth anything: three at the
 * most. A bought fourth heart never earns worth back — buying is insurance, and the most it can
 * hand back is the heart she would otherwise have lost — so the course total does not move.
 */
export const resolveBrawlHeartsCarried = (hearts: number): number => {
  return Math.max(0, Math.min(hearts, BRAWL_WORLD.heartsMax));
};

/**
 * What one refereed block banked for the team: the worth the sim banked (goons down and clean
 * waves) plus `heartWorth` for every heart she walked off with, up to three — only when she
 * walked off. The bay and the bell keep the goons and bank no hearts. Pure; the runtime scores
 * from this and the surfaces count up from it. A bought heart's price is the runtime's to take.
 */
export const resolveBrawlBlockWorth = (result: { outcome: BrawlOutcome; goons: number; hearts: number }): number => {
  return (
    result.goons + (result.outcome === "cleared" ? resolveBrawlHeartsCarried(result.hearts) * BRAWL_WORLD.heartWorth : 0)
  );
};

/**
 * What the whole course is worth — the number the team's worth is put over: every block's goons
 * and clean waves (`goonsTotal`) plus every block's hearts. A perfect course is full points and
 * there is nothing above it; the bonuses are inside the max, not on top.
 */
export const resolveBrawlCourseTotal = (course: { seed: number; blocks: number }): number => {
  const blocks = Math.max(1, Math.floor(course.blocks));
  let total = 0;

  for (let block = 0; block < blocks; block += 1) {
    total += resolveBrawlBlock({ seed: course.seed, blocks, block }).goonsTotal + resolveBrawlHeartsTotal();
  }

  return total;
};
