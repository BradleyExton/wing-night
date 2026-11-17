// PROTOTYPE — throwaway (docs/minigames/ideas/base-borden.md, open question 1). A yard with a
// turret wall at each end, stepped at 60 Hz on the page that draws it. Every shot flies level, so
// there is exactly one way past each: jump the low ones, duck the high ones. That makes the count
// of shots dodged a clean reading of whether a thumb's timing survives the trip from a phone,
// through the server, to this page.

export const YARD = {
  width: 160,
  height: 90,
  groundY: 74,
  wallInset: 8,
  henHalfWidth: 5,
  henHeight: 16,
  duckHeight: 8,
  walkSpeed: 0.9,
  jumpSpeed: 2.2,
  gravity: 0.11,
  /** A press this many ticks before she lands still jumps. */
  jumpBufferTicks: 6,
  heartsMax: 3,
  invulnerableTicks: 70,
  downTicks: 150,
  hurtTicks: 14,
  shotRadius: 2,
  /** A low shot's centre above the ground: under a jump, into a duck. */
  lowShotHeight: 4,
  /** A high shot's centre above the ground: over a duck, into anything taller. */
  highShotHeight: 13,
  sauceEveryTicks: 9,
  sauceSpeed: 2.6,
  sauceLifeTicks: 70,
  /** Where the sauce leaves her, above her feet, standing and ducking. */
  beakHeight: 11,
  duckBeakHeight: 4,
  turretHp: 6,
  turretOutTicks: 300
} as const;

/** Eight directions clockwise from right, the crew pad's numbering; 0 is the thumb at rest. */
export type StickDir = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type YardTuning = {
  /** Units a second. The yard is 160 wide. */
  shotSpeed: number;
  /** How long a turret flashes before it fires. */
  telegraphMs: number;
  /** From one shot leaving to the next turret starting its flash. */
  restMs: number;
  /** Units shaved off every side of her box before a shot counts. */
  forgiveness: number;
  /** Whether the stick points the sauce, or it only ever goes the way she faces. */
  stickAim: boolean;
};

export const DEFAULT_YARD_TUNING: YardTuning = {
  shotSpeed: 60,
  telegraphMs: 600,
  restMs: 700,
  forgiveness: 1.5,
  stickAim: true
};

export type YardHen = {
  padId: string;
  slot: number;
  x: number;
  /** Her feet above the ground: 0 standing on it. */
  lift: number;
  vy: number;
  facing: -1 | 1;
  dir: StickDir;
  jumpSeq: number;
  jumpPressedAt: number;
  hearts: number;
  invulnerableUntil: number;
  hurtUntil: number;
  downUntil: number;
  nextSauceAt: number;
  faced: number;
  dodged: number;
  hits: number;
  turretsOut: number;
};

export type TurretLevel = "low" | "high";

export type YardTurret = {
  id: number;
  side: -1 | 1;
  level: TurretLevel;
  hp: number;
  outUntil: number;
};

export type YardShot = {
  id: number;
  x: number;
  y: number;
  dir: -1 | 1;
  /** The hens this shot has already hit or gone past: it never counts twice for one hen. */
  settled: string[];
};

export type YardSauce = { id: number; padId: string; x: number; y: number; vx: number; vy: number; until: number };

export type YardWorld = {
  tick: number;
  hens: YardHen[];
  turrets: YardTurret[];
  shots: YardShot[];
  sauce: YardSauce[];
  /** The turret flashing now, and the tick it fires on. */
  telegraph: { turretId: number; fireAt: number } | null;
  nextTelegraphAt: number;
  volley: number;
  nextId: number;
};

// The order the turrets take their turns in: both walls, both levels, never the same twice running.
const VOLLEY_ORDER = [0, 3, 1, 2, 0, 1, 3, 2] as const;

const STICK_X: Record<StickDir, -1 | 0 | 1> = { 0: 0, 1: 1, 2: 1, 3: 0, 4: -1, 5: -1, 6: -1, 7: 0, 8: 1 };
const STICK_Y: Record<StickDir, -1 | 0 | 1> = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 1, 5: 0, 6: -1, 7: -1, 8: -1 };
const DIAGONAL = 0.7071;

const msToTicks = (ms: number): number => Math.max(1, Math.round((ms * 60) / 1000));

export const createYardWorld = (): YardWorld => ({
  tick: 0,
  hens: [],
  turrets: [
    { id: 0, side: 1, level: "low", hp: YARD.turretHp, outUntil: 0 },
    { id: 1, side: 1, level: "high", hp: YARD.turretHp, outUntil: 0 },
    { id: 2, side: -1, level: "low", hp: YARD.turretHp, outUntil: 0 },
    { id: 3, side: -1, level: "high", hp: YARD.turretHp, outUntil: 0 }
  ],
  shots: [],
  sauce: [],
  telegraph: null,
  nextTelegraphAt: 120,
  volley: 0,
  nextId: 1
});

export const addHen = (world: YardWorld, padId: string): YardHen => {
  const taken = new Set(world.hens.map((hen) => hen.slot));
  let slot = 0;

  while (taken.has(slot)) {
    slot += 1;
  }

  const hen: YardHen = {
    padId,
    slot,
    x: YARD.width / 2 + (slot % 2 === 0 ? -12 : 12) * (1 + Math.floor(slot / 2)),
    lift: 0,
    vy: 0,
    facing: slot % 2 === 0 ? 1 : -1,
    dir: 0,
    jumpSeq: 0,
    jumpPressedAt: -1000,
    hearts: YARD.heartsMax,
    invulnerableUntil: 0,
    hurtUntil: 0,
    downUntil: 0,
    nextSauceAt: 0,
    faced: 0,
    dodged: 0,
    hits: 0,
    turretsOut: 0
  };

  world.hens.push(hen);

  return hen;
};

export const removeHen = (world: YardWorld, padId: string): void => {
  world.hens = world.hens.filter((hen) => hen.padId !== padId);
};

export const resetHenNumbers = (hen: YardHen): void => {
  hen.faced = 0;
  hen.dodged = 0;
  hen.hits = 0;
  hen.turretsOut = 0;
};

export type HenInput = { dir: StickDir; jumpSeq: number };

/** What a pad last said. A jump is the count going up, so a tap shorter than a frame still counts. */
export const applyHenInput = (world: YardWorld, hen: YardHen, input: HenInput): void => {
  hen.dir = input.dir;

  if (input.jumpSeq !== hen.jumpSeq) {
    hen.jumpSeq = input.jumpSeq;
    hen.jumpPressedAt = world.tick;
  }
};

export const isHenDown = (hen: YardHen, tick: number): boolean => tick < hen.downUntil;

export const isHenAirborne = (hen: YardHen): boolean => hen.lift > 0 || hen.vy > 0;

export const isHenDucking = (hen: YardHen, tick: number): boolean =>
  !isHenDown(hen, tick) && !isHenAirborne(hen) && STICK_Y[hen.dir] === 1;

export const resolveHenHeight = (hen: YardHen, tick: number): number =>
  isHenDucking(hen, tick) ? YARD.duckHeight : YARD.henHeight;

export const resolveTurretX = (turret: YardTurret): number =>
  turret.side === 1 ? YARD.width - YARD.wallInset : YARD.wallInset;

export const resolveTurretHeight = (turret: YardTurret): number =>
  turret.level === "low" ? YARD.lowShotHeight : YARD.highShotHeight;

export const isTurretOut = (turret: YardTurret, tick: number): boolean => tick < turret.outUntil;

export type HenPoseName = "idle" | "walk" | "fly" | "hurt" | "ko";

export const resolveHenPose = (hen: YardHen, tick: number): HenPoseName => {
  if (isHenDown(hen, tick)) {
    return "ko";
  }

  if (tick < hen.hurtUntil) {
    return "hurt";
  }

  if (isHenAirborne(hen)) {
    return "fly";
  }

  return STICK_X[hen.dir] !== 0 && !isHenDucking(hen, tick) ? "walk" : "idle";
};

const stepHen = (world: YardWorld, hen: YardHen, tuning: YardTuning): void => {
  const { tick } = world;

  if (isHenDown(hen, tick)) {
    hen.lift = Math.max(0, hen.lift + hen.vy);
    hen.vy = hen.lift > 0 ? hen.vy - YARD.gravity : 0;

    return;
  }

  if (hen.hearts <= 0) {
    // Back on her feet: the lab is about the dodge, not the wipe.
    hen.hearts = YARD.heartsMax;
    hen.invulnerableUntil = tick + YARD.invulnerableTicks;
  }

  const stickX = STICK_X[hen.dir];
  const grounded = !isHenAirborne(hen);

  if (stickX !== 0) {
    hen.facing = stickX;
  }

  if (grounded && tick - hen.jumpPressedAt <= YARD.jumpBufferTicks) {
    hen.vy = YARD.jumpSpeed;
    hen.jumpPressedAt = -1000;
  }

  // A duck plants her; she steers freely in the air.
  if (stickX !== 0 && !isHenDucking(hen, tick)) {
    const edge = YARD.wallInset + YARD.henHalfWidth + 6;

    hen.x = Math.min(YARD.width - edge, Math.max(edge, hen.x + stickX * YARD.walkSpeed));
  }

  if (hen.vy !== 0 || hen.lift > 0) {
    hen.lift += hen.vy;
    hen.vy -= YARD.gravity;

    if (hen.lift <= 0) {
      hen.lift = 0;
      hen.vy = 0;
    }
  }

  if (tick >= hen.nextSauceAt) {
    const ducking = isHenDucking(hen, tick);
    const aimX = tuning.stickAim && !ducking ? stickX : 0;
    const aimY = tuning.stickAim && !ducking ? STICK_Y[hen.dir] : 0;
    const level = aimX === 0 && aimY === 0;
    const scale = aimX !== 0 && aimY !== 0 ? DIAGONAL : 1;

    hen.nextSauceAt = tick + YARD.sauceEveryTicks;
    world.sauce.push({
      id: world.nextId,
      padId: hen.padId,
      x: hen.x + hen.facing * YARD.henHalfWidth,
      y: YARD.groundY - hen.lift - (ducking ? YARD.duckBeakHeight : YARD.beakHeight),
      vx: (level ? hen.facing : aimX) * YARD.sauceSpeed * scale,
      // The pad's "down" is toward the ground, which is where the screen's y grows.
      vy: aimY * YARD.sauceSpeed * scale,
      until: tick + YARD.sauceLifeTicks
    });
    world.nextId += 1;
  }
};

const stepTurrets = (world: YardWorld, tuning: YardTuning): void => {
  const { tick } = world;

  for (const turret of world.turrets) {
    if (turret.outUntil !== 0 && tick >= turret.outUntil) {
      turret.outUntil = 0;
      turret.hp = YARD.turretHp;
    }
  }

  if (world.telegraph !== null && tick >= world.telegraph.fireAt) {
    const turret = world.turrets.find((candidate) => candidate.id === world.telegraph?.turretId);

    if (turret !== undefined && !isTurretOut(turret, tick)) {
      world.shots.push({
        id: world.nextId,
        x: resolveTurretX(turret) - turret.side * 4,
        y: YARD.groundY - resolveTurretHeight(turret),
        dir: turret.side === 1 ? -1 : 1,
        settled: []
      });
      world.nextId += 1;
    }

    world.telegraph = null;
    world.nextTelegraphAt = tick + msToTicks(tuning.restMs);
  }

  if (world.telegraph === null && tick >= world.nextTelegraphAt && world.hens.length > 0) {
    // Skip a turret that is out; with all four out the yard is quiet until one comes back.
    for (let tries = 0; tries < VOLLEY_ORDER.length; tries += 1) {
      const turretId = VOLLEY_ORDER[world.volley % VOLLEY_ORDER.length] ?? 0;
      const turret = world.turrets.find((candidate) => candidate.id === turretId);

      world.volley += 1;

      if (turret !== undefined && !isTurretOut(turret, tick)) {
        world.telegraph = { turretId, fireAt: tick + msToTicks(tuning.telegraphMs) };
        break;
      }
    }
  }
};

const stepShots = (world: YardWorld, tuning: YardTuning): void => {
  const { tick } = world;
  const speed = tuning.shotSpeed / 60;
  const kept: YardShot[] = [];

  for (const shot of world.shots) {
    let spent = false;

    shot.x += shot.dir * speed;

    for (const hen of world.hens) {
      if (shot.settled.includes(hen.padId)) {
        continue;
      }

      const half = YARD.henHalfWidth;
      const feetY = YARD.groundY - hen.lift;
      const gone = shot.dir === 1 ? shot.x - YARD.shotRadius > hen.x + half : shot.x + YARD.shotRadius < hen.x - half;

      if (gone) {
        // It went by her. A shot that passed while she could not be hurt is nobody's dodge.
        shot.settled.push(hen.padId);

        if (!isHenDown(hen, tick) && tick >= hen.invulnerableUntil) {
          hen.faced += 1;
          hen.dodged += 1;
        }

        continue;
      }

      const reach = Math.max(0.5, half - tuning.forgiveness);
      const top = feetY - resolveHenHeight(hen, tick) + tuning.forgiveness;
      const bottom = feetY - tuning.forgiveness;
      const overlaps =
        Math.abs(shot.x - hen.x) < reach + YARD.shotRadius &&
        shot.y + YARD.shotRadius > top &&
        shot.y - YARD.shotRadius < bottom;

      if (!overlaps || isHenDown(hen, tick) || tick < hen.invulnerableUntil) {
        continue;
      }

      shot.settled.push(hen.padId);
      hen.faced += 1;
      hen.hits += 1;
      hen.hearts -= 1;
      hen.hurtUntil = tick + YARD.hurtTicks;
      hen.invulnerableUntil = tick + YARD.invulnerableTicks;

      if (hen.hearts <= 0) {
        hen.downUntil = tick + YARD.downTicks;
      }

      spent = true;
      break;
    }

    if (!spent && shot.x > -YARD.shotRadius && shot.x < YARD.width + YARD.shotRadius) {
      kept.push(shot);
    }
  }

  world.shots = kept;
};

const stepSauce = (world: YardWorld): void => {
  const { tick } = world;
  const kept: YardSauce[] = [];

  for (const drop of world.sauce) {
    drop.x += drop.vx;
    drop.y += drop.vy;

    const turret = world.turrets.find(
      (candidate) =>
        !isTurretOut(candidate, tick) &&
        Math.abs(drop.x - resolveTurretX(candidate)) < 5 &&
        Math.abs(drop.y - (YARD.groundY - resolveTurretHeight(candidate))) < 4.5
    );

    if (turret !== undefined) {
      turret.hp -= 1;

      if (turret.hp <= 0) {
        const hen = world.hens.find((candidate) => candidate.padId === drop.padId);

        turret.outUntil = tick + YARD.turretOutTicks;

        if (hen !== undefined) {
          hen.turretsOut += 1;
        }

        if (world.telegraph?.turretId === turret.id) {
          world.telegraph = null;
          world.nextTelegraphAt = tick + 30;
        }
      }

      continue;
    }

    const inYard = drop.x > 0 && drop.x < YARD.width && drop.y > 0 && drop.y < YARD.groundY;

    if (tick < drop.until && inYard) {
      kept.push(drop);
    }
  }

  world.sauce = kept;
};

export const stepYard = (world: YardWorld, tuning: YardTuning): void => {
  world.tick += 1;

  for (const hen of world.hens) {
    stepHen(world, hen, tuning);
  }

  stepTurrets(world, tuning);
  stepShots(world, tuning);
  stepSauce(world);
};
