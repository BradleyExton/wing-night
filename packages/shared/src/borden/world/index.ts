import { createMulberry32, pickInteger } from "../../seededRandom/index.js";
import type {
  BordenBottle,
  BordenBottleDrop,
  BordenFoeKind,
  BordenShotLevel,
  BordenSpawn,
  BordenStick,
  BordenStretch,
  BordenStretchName,
  BordenStretchSpec
} from "../types.js";

/**
 * The base, in numbers (docs/minigames/base-borden-spec.md §0.3). The hen's own numbers are the
 * jump lab's (deleted with spec §0.7 step 7; its `yardSim` is in git history), which Brad played on
 * his phone and called fair; the shot's are the lab's defaults. Speeds are per tick at 60 Hz, lengths in the
 * lab's units: the window is 160 by 90, and the ground is y = 0.
 */
export const BORDEN_WORLD = {
  tickHz: 60,
  width: 160,
  height: 90,

  henHalfWidth: 5,
  henHeight: 16,
  duckHeight: 8,
  walkSpeed: 0.9,
  jumpSpeed: 2.2,
  gravity: 0.11,
  /** A press this many ticks before she lands still jumps. */
  jumpBufferTicks: 6,
  heartsMax: 3,
  /** What one heart carried through the gate banks. */
  heartWorth: 1,
  invulnerableTicks: 70,
  hurtTicks: 14,
  /** How near the window's edges a hen may stand. */
  henMargin: 8,
  /** The camera keeps the lead hen this share of the window in from its left edge, and never goes back. */
  cameraLeadShare: 0.4,
  /** Units shaved off every side of her box before a shot or a body counts (lab: 1.5). */
  forgiveness: 1.5,

  /** Where the sauce leaves her, above her feet, standing and ducking. */
  beakHeight: 11,
  duckBeakHeight: 4,
  sauceRadius: 1.5,
  /** A diagonal's two components, fixed, so the sim never takes a square root. */
  diagonal: 0.7071,
  /**
   * The spread's outer streams: the aim plus or minus this much of its perpendicular, scaled back
   * to the aim's length by `spreadScale` (1 over √(1 + 0.35²), rounded once here). About 19°.
   */
  spreadSide: 0.35,
  spreadScale: 0.9439,
  /** How fast puddle sauce falls, a tick. */
  sauceGravity: 0.06,
  puddleHalfWidth: 6,
  puddleTicks: 120,
  /** A puddle takes one off whatever stands in it this often. */
  burnEveryTicks: 15,
  bottles: {
    mild: { everyTicks: 9, speed: 2.6, lifeTicks: 70, streams: 1, falls: false },
    spread: { everyTicks: 11, speed: 2.6, lifeTicks: 55, streams: 3, falls: false },
    long: { everyTicks: 8, speed: 3.6, lifeTicks: 80, streams: 1, falls: false },
    puddle: { everyTicks: 12, speed: 2.2, lifeTicks: 90, streams: 1, falls: true }
  } satisfies Record<BordenBottle, { everyTicks: number; speed: number; lifeTicks: number; streams: number; falls: boolean }>,
  /** How near the bottle on the ground she has to run to take it. */
  bottleReach: 6,

  /** A low shot's centre above the ground: under a jump, into a duck. */
  lowShotHeight: 4,
  /** A high shot's centre above the ground: over a duck, into anything taller. */
  highShotHeight: 13,
  shotRadius: 2,
  shellRadius: 3,
  /** Units a tick: 60 a second (lab). A tank's shell is half that. */
  shotSpeed: 1,
  shellSpeedShare: 0.5,
  /** The first shot of every stretch flies at this share of its speed (principles §18). */
  firstShotSpeedShare: 0.6,
  /** A shooter flashes this long before it fires: 600 ms (lab). */
  telegraphTicks: 36,
  /** The first flash of a stretch starts this long in. */
  firstTelegraphTick: 90,
  /** A shooter sprayed down mid-flash: the next flash starts this soon after. */
  cancelRestTicks: 30,

  foes: {
    turret: { halfWidth: 4, height: 9, hp: 6, worth: 2, speed: 0 },
    tank: { halfWidth: 10, height: 14, hp: 14, worth: 4, speed: 0.6 },
    goose: { halfWidth: 4, height: 7, hp: 1, worth: 1, speed: 1.15 },
    sergeant: { halfWidth: 9, height: 26, hp: 18, worth: 10, speed: 0 }
  } satisfies Record<BordenFoeKind, { halfWidth: number; height: number; hp: number; worth: number; speed: number }>,
  /** The sergeant's hp is this for each hen in the pair: two hoses, twice the shouting. */
  sergeantHpPerHen: 18,
  /** A goose or a tank is born this far past the window's right edge and comes in. */
  enterLead: 6,
  /** A tank wakes this far before its parking spot reaches the window, so it is seen rolling in. */
  tankWakeLead: 30,
  /** A foe sprayed down stays in the frame this long, for a screen to fell it. */
  koLingerTicks: 45,

  /** A second and a half of her partner standing over her gets a downed hen up, on one heart. */
  reviveTicks: 90,
  reviveReach: 12,
  reviveHearts: 1,
  /** Ten seconds with the stick at rest and no press: she sits down and nothing aims at her. */
  awayTicks: 10 * 60,
  /** A safety cap, not a clock anyone sees: three minutes and the stretch is over. */
  stretchCapTicks: 180 * 60,
  /** How long an event stays in the frame: two seconds, long enough for any screen to have rung it. */
  eventWindowTicks: 120,
  /** The room holds four seats. */
  maxPlayers: 4
} as const;

/** Each stick direction as a step along the stretch and up or down: the crew pad's numbering. */
export const BORDEN_STICKS: Record<BordenStick, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
  0: { x: 0, y: 0 },
  1: { x: 1, y: 0 },
  2: { x: 1, y: -1 },
  3: { x: 0, y: -1 },
  4: { x: -1, y: -1 },
  5: { x: -1, y: 0 },
  6: { x: -1, y: 1 },
  7: { x: 0, y: 1 },
  8: { x: 1, y: 1 }
};

type StretchKit = {
  name: BordenStretchName;
  screens: number;
  turrets: number;
  geese: number;
  tanks: number;
  sergeant: boolean;
  restTicks: number;
};

/**
 * The three stretches, each harder than the last: more shooters, and less rest between shots
 * (spec §0.3). The rests are 900, 700 and 550 ms.
 */
const KITS: readonly StretchKit[] = [
  { name: "fences", screens: 4, turrets: 4, geese: 3, tanks: 0, sergeant: false, restTicks: 54 },
  { name: "motor-pool", screens: 5, turrets: 4, geese: 6, tanks: 1, sergeant: false, restTicks: 42 },
  { name: "parade-square", screens: 5, turrets: 4, geese: 5, tanks: 1, sergeant: true, restTicks: 33 }
];

/** How many stretches a game is. */
export const BORDEN_STRETCHES = KITS.length;

const HOT_BOTTLES: readonly Exclude<BordenBottle, "mild">[] = ["spread", "long", "puddle"];

/** Turrets and geese are dealt between here (a share of the window in) and the sergeant's ground. */
const PLAY_FROM_SHARE = 0.7;
const PLAY_TO_SHARE = 0.4;
const TURRET_JITTER = 12;
const GOOSE_JITTER = 20;
/** The tank parks this share of the way along the dealt ground. */
const TANK_SHARE = 0.55;
const SERGEANT_FROM_GATE = 24;
const GATE_FROM_END = 10;

const resolveKit = (stretch: number): StretchKit => {
  return KITS[Math.max(0, Math.min(KITS.length - 1, Math.floor(stretch)))] ?? (KITS[0] as StretchKit);
};

/** A pair's size as a stretch is furnished for it: one hen or two. */
export const resolveBordenPairSize = (pair: number | undefined): number => {
  return Math.max(1, Math.min(2, Math.floor(pair ?? 2)));
};

/**
 * Who runs which stretch, as indexes into the room's players in the order they sat (spec §0.3):
 * two run every stretch together; three go A+B, C+A, B+C; four go A+B, C+D, A+C. One runs alone.
 */
export const resolveBordenPairs = (players: number): number[][] => {
  const count = Math.max(1, Math.min(BORDEN_WORLD.maxPlayers, Math.floor(players)));

  if (count === 1) {
    return [[0], [0], [0]];
  }

  if (count === 2) {
    return [
      [0, 1],
      [0, 1],
      [0, 1]
    ];
  }

  if (count === 3) {
    return [
      [0, 1],
      [2, 0],
      [1, 2]
    ];
  }

  return [
    [0, 1],
    [2, 3],
    [0, 2]
  ];
};

/** Where the window's right edge has to reach before a spawn wakes. Spawns are dealt in this order. */
export const resolveBordenWakeX = (spawn: Pick<BordenSpawn, "kind" | "x">): number => {
  const { foes, tankWakeLead } = BORDEN_WORLD;

  if (spawn.kind === "goose") {
    return spawn.x;
  }

  if (spawn.kind === "tank") {
    return spawn.x + foes.tank.halfWidth - tankWakeLead;
  }

  return spawn.x - foes[spawn.kind].halfWidth;
};

/** The bottom and top of a foe's box above the ground. A turret's box sits on its shot's height. */
export const resolveBordenFoeBox = (foe: { kind: BordenFoeKind; level: BordenShotLevel }): { bottom: number; top: number } => {
  const { foes, lowShotHeight, highShotHeight } = BORDEN_WORLD;

  if (foe.kind !== "turret") {
    return { bottom: 0, top: foes[foe.kind].height };
  }

  const centre = foe.level === "low" ? lowShotHeight : highShotHeight;
  const half = foes.turret.height / 2;

  return { bottom: Math.max(0, centre - half), top: centre + half };
};

/** The stretch's foes' hp: the sergeant's is the pair's, the rest are fixed. */
export const resolveBordenFoeHp = (kind: BordenFoeKind, pair: number): number => {
  return kind === "sergeant" ? BORDEN_WORLD.sergeantHpPerHen * resolveBordenPairSize(pair) : BORDEN_WORLD.foes[kind].hp;
};

const spread = (count: number, from: number, to: number): number[] => {
  return Array.from({ length: count }, (_, slot) => from + Math.floor(((slot + 1) * (to - from)) / (count + 1)));
};

const dealLevel = (random: () => number, previous: BordenShotLevel | null): BordenShotLevel => {
  if (previous === null) {
    return random() < 0.5 ? "low" : "high";
  }

  // Mostly turn and turn about, but one in three repeats, so the next answer is read, not counted.
  if (pickInteger(random, 0, 2) === 0) {
    return previous;
  }

  return previous === "low" ? "high" : "low";
};

/**
 * Which hot bottle lies in which stretch: a shuffle of the three from the game's seed alone, so the
 * three stretches of one game each get a different one.
 */
const resolveHotBottle = (seed: number, stretch: number): Exclude<BordenBottle, "mild"> => {
  const random = createMulberry32((seed ^ 0x0b077e5) | 0);
  const order = [...HOT_BOTTLES];

  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = pickInteger(random, 0, index);
    const held = order[index] as Exclude<BordenBottle, "mild">;

    order[index] = order[other] as Exclude<BordenBottle, "mild">;
    order[other] = held;
  }

  return order[stretch % order.length] ?? "spread";
};

/**
 * One stretch of the base, furnished for a pair and laid out from the game's seed. Each stretch
 * draws from its own stream, so the parade square is the same ground whoever runs it; only the
 * sergeant's hp, and the hearts the stretch can bank, follow the pair's size.
 */
export const resolveBordenStretch = (spec: BordenStretchSpec): BordenStretch => {
  const { width, foes, heartsMax, heartWorth } = BORDEN_WORLD;
  const index = Math.max(0, Math.min(KITS.length - 1, Math.floor(spec.stretch)));
  const kit = resolveKit(index);
  const pair = resolveBordenPairSize(spec.pair);
  const random = createMulberry32((spec.seed ^ Math.imul(index + 1, 0x9e3779b9)) | 0);
  const length = kit.screens * width;
  const gateX = length - GATE_FROM_END;
  const from = Math.floor(width * PLAY_FROM_SHARE);
  const to = gateX - Math.floor(width * PLAY_TO_SHARE);
  const dealt: Omit<BordenSpawn, "id">[] = [];
  let level: BordenShotLevel | null = null;

  for (const x of spread(kit.turrets, from, to)) {
    level = dealLevel(random, level);
    dealt.push({ kind: "turret", x: x + pickInteger(random, -TURRET_JITTER, TURRET_JITTER), level });
  }

  for (const x of spread(kit.geese, from, to)) {
    dealt.push({ kind: "goose", x: x + pickInteger(random, -GOOSE_JITTER, GOOSE_JITTER), level: "low" });
  }

  for (let tank = 0; tank < kit.tanks; tank += 1) {
    dealt.push({ kind: "tank", x: from + Math.floor((to - from) * TANK_SHARE), level: "low" });
  }

  if (kit.sergeant) {
    dealt.push({ kind: "sergeant", x: gateX - SERGEANT_FROM_GATE, level: random() < 0.5 ? "low" : "high" });
  }

  // Spawns wake in this order, so the frame need only count how many have.
  const spawns = dealt
    .map((spawn, order) => ({ spawn, order }))
    .sort((left, right) => resolveBordenWakeX(left.spawn) - resolveBordenWakeX(right.spawn) || left.order - right.order)
    .map(({ spawn }, id) => ({ id, ...spawn }));
  const bottle: BordenBottleDrop = {
    x: pickInteger(random, Math.floor(width * 0.5), Math.floor(width * 1.2)),
    bottle: resolveHotBottle(spec.seed, index)
  };

  return {
    index,
    name: kit.name,
    pair,
    length,
    gateX,
    spawns,
    bottle,
    restTicks: kit.restTicks,
    total: spawns.reduce((total, spawn) => total + foes[spawn.kind].worth, 0) + heartsMax * heartWorth * pair
  };
};

/** What a whole game is worth to a room of this many: the number its banked worth is put over. */
export const resolveBordenCourseTotal = (course: { seed: number; players: number }): number => {
  return resolveBordenPairs(course.players).reduce((total, pair, stretch) => {
    return total + resolveBordenStretch({ seed: course.seed, stretch, pair: pair.length }).total;
  }, 0);
};
