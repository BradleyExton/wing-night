import { BRAWL_WORLD } from "@wingnight/shared";

// PROTOTYPE — throwaway. A street with DEPTH: the question four-at-once Streets of Barrie has to
// answer before its spec is rewritten. Hens walk in x and z (z is toward the camera), geese come
// at them, and the knobs below are the candidate rules. It borrows the real game's numbers
// (`BRAWL_WORLD`) so a peck and a goose feel like the shipped ones, and none of its code: this
// sim mutates in place, rolls `Math.random` and is not the deterministic referee the real one is.

export const STREET = {
  width: BRAWL_WORLD.width,
  height: BRAWL_WORLD.height,
  /** Screen y of the back of the walkable band (z = 0) and how deep the band runs toward the camera. */
  backY: 57,
  depth: 27,
  margin: 8,
  lanes: 3
} as const;

const GOOSE = BRAWL_WORLD.goons.goose;

/** How far off a goose's line a hen can stand and still be hit by its lunge. */
const GOOSE_HIT_BAND = 4;
/** How far off the hen's line a goose will start its honk from. */
const GOOSE_TELEGRAPH_BAND = 4;
const KO_TICKS = 180;
const GOOSE_KO_TICKS = 45;
const SPAWN_GAP_TICKS = 50;
const ALIGN_SPEED = 1.2;
const LANE_EASE_SPEED = 1.5;
const PECK_BUFFER_TICKS = 10;

export type DepthMode = "free" | "lanes";

export type StreetTuning = {
  /** Free 2-D movement, or three discrete lanes a flick steps between. */
  depthMode: DepthMode;
  /** A peck lands on a goose within this much depth of her line (free mode). */
  depthBand: number;
  /** A peck slides her onto the line of the goose it is about to hit. */
  autoAlign: boolean;
  /** Geese step onto their target's line from a standoff before they close, the classic way. */
  goonLineUp: boolean;
  /** How fast she moves in depth, as a share of her walk speed. */
  depthSpeedShare: number;
  /** Geese on the street at once, before one more per extra hen. */
  geeseAtOnce: number;
};

export const DEFAULT_STREET_TUNING: StreetTuning = {
  depthMode: "free",
  depthBand: 7,
  autoAlign: true,
  goonLineUp: true,
  depthSpeedShare: 0.7,
  geeseAtOnce: 3
};

export type HenInput = { x: number; y: number; peckHeld: boolean; peckSeq: number };

export type StreetHen = {
  padId: string;
  slot: number;
  x: number;
  z: number;
  facing: -1 | 1;
  input: HenInput;
  peckSeqSeen: number;
  peckWantedUntil: number;
  peckStartTick: number;
  peckUntil: number;
  peckCooldownUntil: number;
  peckSpent: boolean;
  peckSawOffLine: boolean;
  alignZ: number | null;
  lane: number;
  laneArmed: boolean;
  hearts: number;
  hurtUntil: number;
  invulnerableUntil: number;
  koUntil: number;
  moving: boolean;
  // The numbers the lab exists to read.
  pecks: number;
  landed: number;
  depthWhiffs: number;
  kos: number;
  hits: number;
};

export type GooseState = "enter" | "approach" | "telegraph" | "attack" | "recover" | "ko";

export type StreetGoose = {
  id: number;
  x: number;
  z: number;
  facing: -1 | 1;
  state: GooseState;
  until: number;
  bornTick: number;
};

export type StreetWorld = {
  tick: number;
  hens: StreetHen[];
  geese: StreetGoose[];
  nextGooseId: number;
  nextSpawnTick: number;
  nextSpawnSide: -1 | 1;
};

export const createStreetWorld = (): StreetWorld => ({
  tick: 0,
  hens: [],
  geese: [],
  nextGooseId: 1,
  nextSpawnTick: 60,
  nextSpawnSide: 1
});

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const sign = (value: number): -1 | 0 | 1 => (value > 0 ? 1 : value < 0 ? -1 : 0);

const resolveLaneZ = (lane: number): number => (STREET.depth * (lane + 0.5)) / STREET.lanes;

const resolveNearestLane = (z: number): number =>
  clamp(Math.round((z * STREET.lanes) / STREET.depth - 0.5), 0, STREET.lanes - 1);

/** The depth a peck reaches: the knob in free mode, the hen's own lane in lanes mode. */
const resolvePeckBand = (tuning: StreetTuning): number =>
  tuning.depthMode === "lanes" ? STREET.depth / STREET.lanes / 2 - 0.5 : tuning.depthBand;

export const isHenDown = (hen: StreetHen, tick: number): boolean => tick < hen.koUntil;

const isGooseStanding = (goose: StreetGoose): boolean => goose.state !== "ko" && goose.state !== "enter";

export const addHen = (world: StreetWorld, padId: string): StreetHen => {
  const taken = new Set(world.hens.map((hen) => hen.slot));
  let slot = 0;

  while (taken.has(slot)) {
    slot += 1;
  }

  const lane = slot % STREET.lanes;
  const hen: StreetHen = {
    padId,
    slot,
    x: 30 + slot * 14,
    z: resolveLaneZ(lane),
    facing: 1,
    input: { x: 0, y: 0, peckHeld: false, peckSeq: 0 },
    peckSeqSeen: 0,
    peckWantedUntil: -1,
    peckStartTick: -1,
    peckUntil: -1,
    peckCooldownUntil: -1,
    peckSpent: true,
    peckSawOffLine: false,
    alignZ: null,
    lane,
    laneArmed: true,
    hearts: BRAWL_WORLD.heartsMax,
    hurtUntil: -1,
    invulnerableUntil: world.tick + BRAWL_WORLD.invulnerableTicks,
    koUntil: -1,
    moving: false,
    pecks: 0,
    landed: 0,
    depthWhiffs: 0,
    kos: 0,
    hits: 0
  };

  world.hens.push(hen);

  return hen;
};

export const removeHen = (world: StreetWorld, padId: string): void => {
  world.hens = world.hens.filter((hen) => hen.padId !== padId);
};

/** The latest thing a pad said. A press counted since the last one is a peck she owes. */
export const applyHenInput = (world: StreetWorld, hen: StreetHen, input: HenInput): void => {
  if (input.peckSeq !== hen.peckSeqSeen) {
    hen.peckSeqSeen = input.peckSeq;
    hen.peckWantedUntil = world.tick + PECK_BUFFER_TICKS;
  }

  hen.input = input;
};

const findAlignTarget = (world: StreetWorld, hen: StreetHen, band: number): StreetGoose | null => {
  let best: StreetGoose | null = null;
  let bestScore = Infinity;

  for (const goose of world.geese) {
    if (!isGooseStanding(goose)) {
      continue;
    }

    const ahead = (goose.x - hen.x) * hen.facing;
    const off = Math.abs(goose.z - hen.z);

    if (ahead < -BRAWL_WORLD.henRadius - GOOSE.halfWidth || ahead > BRAWL_WORLD.peckReach + BRAWL_WORLD.henRadius + GOOSE.halfWidth + 4) {
      continue;
    }

    if (off > band) {
      continue;
    }

    const score = off * 2 + Math.abs(ahead);

    if (score < bestScore) {
      best = goose;
      bestScore = score;
    }
  }

  return best;
};

const stepHenPeck = (world: StreetWorld, hen: StreetHen, tuning: StreetTuning): void => {
  const { tick } = world;
  const band = resolvePeckBand(tuning);
  const wants = hen.input.peckHeld || tick <= hen.peckWantedUntil;

  if (wants && tick >= hen.peckCooldownUntil && tick >= hen.hurtUntil) {
    hen.peckStartTick = tick;
    hen.peckUntil = tick + BRAWL_WORLD.peckDelayTicks + BRAWL_WORLD.peckActiveTicks;
    hen.peckCooldownUntil = hen.peckUntil + BRAWL_WORLD.peckCooldownTicks;
    hen.peckWantedUntil = -1;
    hen.peckSpent = false;
    hen.peckSawOffLine = false;
    hen.pecks += 1;
    hen.alignZ = null;

    if (tuning.autoAlign && tuning.depthMode === "free") {
      const target = findAlignTarget(world, hen, band);

      hen.alignZ = target === null ? null : target.z;
    }
  }

  if (tick >= hen.peckUntil) {
    if (!hen.peckSpent) {
      // The peck's window shut on nothing. If a goose was in its reach but off her line, that is
      // the genre's own failure, and the number this lab is counting.
      hen.peckSpent = true;

      if (hen.peckSawOffLine) {
        hen.depthWhiffs += 1;
      }
    }

    hen.alignZ = null;

    return;
  }

  if (hen.peckSpent || tick < hen.peckStartTick + BRAWL_WORLD.peckDelayTicks) {
    return;
  }

  // The real game's box: from her back edge to `peckReach` past her front.
  const back = hen.x - hen.facing * BRAWL_WORLD.henRadius;
  const front = hen.x + hen.facing * (BRAWL_WORLD.henRadius + BRAWL_WORLD.peckReach);
  const boxMin = Math.min(back, front);
  const boxMax = Math.max(back, front);
  let struck: StreetGoose | null = null;
  let struckDistance = Infinity;

  for (const goose of world.geese) {
    if (!isGooseStanding(goose)) {
      continue;
    }

    if (goose.x + GOOSE.halfWidth < boxMin || goose.x - GOOSE.halfWidth > boxMax) {
      continue;
    }

    if (Math.abs(goose.z - hen.z) > band) {
      hen.peckSawOffLine = true;
      continue;
    }

    const distance = Math.abs(goose.x - hen.x);

    if (distance < struckDistance) {
      struck = goose;
      struckDistance = distance;
    }
  }

  if (struck !== null) {
    struck.state = "ko";
    struck.until = tick + GOOSE_KO_TICKS;
    struck.x = clamp(struck.x + hen.facing * GOOSE.knockback, -4, STREET.width + 4);
    hen.peckSpent = true;
    hen.landed += 1;
    hen.kos += 1;
  }
};

const stepHen = (world: StreetWorld, hen: StreetHen, tuning: StreetTuning): void => {
  const { tick } = world;

  if (hen.koUntil > 0 && tick >= hen.koUntil) {
    // Back on the street at the next beat: the prototype's stand-in for "walks back in next wave".
    hen.koUntil = -1;
    hen.hearts = BRAWL_WORLD.heartsMax;
    hen.x = STREET.margin + 6;
    hen.invulnerableUntil = tick + BRAWL_WORLD.invulnerableTicks;
  }

  if (isHenDown(hen, tick)) {
    hen.moving = false;

    return;
  }

  stepHenPeck(world, hen, tuning);

  if (tick < hen.hurtUntil) {
    hen.moving = false;

    return;
  }

  const pecking = tick < hen.peckUntil;
  const speed = BRAWL_WORLD.henWalkSpeed * (pecking ? 0.4 : 1);
  const { x: stickX, y: stickY } = hen.input;

  if (Math.abs(stickX) > 0.25) {
    hen.facing = stickX > 0 ? 1 : -1;
  }

  hen.x = clamp(hen.x + stickX * speed, STREET.margin, STREET.width - STREET.margin);

  if (tuning.depthMode === "lanes") {
    if (Math.abs(stickY) < 0.3) {
      hen.laneArmed = true;
    } else if (hen.laneArmed && Math.abs(stickY) > 0.55) {
      hen.lane = clamp(hen.lane + sign(stickY), 0, STREET.lanes - 1);
      hen.laneArmed = false;
    }

    const laneZ = resolveLaneZ(hen.lane);

    hen.z += clamp(laneZ - hen.z, -LANE_EASE_SPEED, LANE_EASE_SPEED);
  } else if (hen.alignZ !== null) {
    hen.z += clamp(hen.alignZ - hen.z, -ALIGN_SPEED, ALIGN_SPEED);
  } else {
    hen.z = clamp(hen.z + stickY * speed * tuning.depthSpeedShare, 0, STREET.depth);
    hen.lane = resolveNearestLane(hen.z);
  }

  hen.moving = Math.abs(stickX) > 0.05 || Math.abs(stickY) > 0.05;
};

const findTarget = (world: StreetWorld, goose: StreetGoose): StreetHen | null => {
  let best: StreetHen | null = null;
  let bestScore = Infinity;

  for (const hen of world.hens) {
    if (isHenDown(hen, world.tick)) {
      continue;
    }

    const score = Math.abs(hen.x - goose.x) + Math.abs(hen.z - goose.z) * 2;

    if (score < bestScore) {
      best = hen;
      bestScore = score;
    }
  }

  return best;
};

const hurtHen = (world: StreetWorld, hen: StreetHen, goose: StreetGoose): void => {
  const away = sign(hen.x - goose.x) || goose.facing;

  hen.hearts -= 1;
  hen.hits += 1;
  hen.x = clamp(hen.x + away * BRAWL_WORLD.hitKnockback, STREET.margin, STREET.width - STREET.margin);
  hen.hurtUntil = world.tick + BRAWL_WORLD.hurtTicks;
  hen.invulnerableUntil = world.tick + BRAWL_WORLD.invulnerableTicks;
  hen.peckUntil = world.tick;
  hen.peckSpent = true;
  hen.alignZ = null;

  if (hen.hearts <= 0) {
    hen.koUntil = world.tick + KO_TICKS;
  }
};

const stepGoose = (world: StreetWorld, goose: StreetGoose, tuning: StreetTuning): void => {
  const { tick } = world;

  if (goose.state === "ko") {
    return;
  }

  if (goose.state === "enter") {
    goose.x += goose.facing * GOOSE.speed * 1.4;

    if (goose.x > STREET.margin && goose.x < STREET.width - STREET.margin) {
      goose.state = "approach";
    }

    return;
  }

  if (goose.state === "telegraph") {
    if (tick >= goose.until) {
      goose.state = "attack";
      goose.until = tick + GOOSE.attackTicks;
    }

    return;
  }

  if (goose.state === "attack") {
    goose.x += goose.facing * GOOSE.lunge;

    for (const hen of world.hens) {
      if (isHenDown(hen, tick) || tick < hen.invulnerableUntil) {
        continue;
      }

      if (Math.abs(hen.x - goose.x) < GOOSE.halfWidth + BRAWL_WORLD.henRadius && Math.abs(hen.z - goose.z) <= GOOSE_HIT_BAND) {
        hurtHen(world, hen, goose);
      }
    }

    if (tick >= goose.until) {
      goose.state = "recover";
      goose.until = tick + GOOSE.recoverTicks;
      goose.x = clamp(goose.x, 2, STREET.width - 2);
    }

    return;
  }

  if (goose.state === "recover") {
    if (tick >= goose.until) {
      goose.state = "approach";
    }

    return;
  }

  const target = findTarget(world, goose);

  if (target === null) {
    return;
  }

  const dx = target.x - goose.x;
  const dz =
    (tuning.depthMode === "lanes" ? resolveLaneZ(resolveNearestLane(target.z)) : target.z) - goose.z;

  goose.facing = dx >= 0 ? 1 : -1;

  if (Math.abs(dx) <= GOOSE.reach && Math.abs(dz) <= GOOSE_TELEGRAPH_BAND) {
    goose.state = "telegraph";
    goose.until = tick + GOOSE.telegraphTicks;

    return;
  }

  if (tuning.goonLineUp) {
    // The classic script: get on her line from a standoff, then close along it.
    const standoff = GOOSE.reach + 8;
    const lined = Math.abs(dz) <= GOOSE_TELEGRAPH_BAND - 1;

    goose.z += clamp(dz, -GOOSE.speed * 0.8, GOOSE.speed * 0.8);

    if (lined ? Math.abs(dx) > GOOSE.reach : Math.abs(dx) > standoff) {
      goose.x += goose.facing * GOOSE.speed;
    }
  } else {
    // Straight at her, from whatever angle it happens to be on.
    const length = Math.hypot(dx, dz) || 1;

    if (Math.abs(dx) > GOOSE.reach - 2) {
      goose.x += (dx / length) * GOOSE.speed;
    }

    goose.z += (dz / length) * GOOSE.speed;
  }

  goose.z = clamp(goose.z, 0, STREET.depth);
};

// Two geese on one spot read as one goose: nudge them apart in depth.
const separateGeese = (world: StreetWorld): void => {
  for (let i = 0; i < world.geese.length; i += 1) {
    for (let j = i + 1; j < world.geese.length; j += 1) {
      const a = world.geese[i];
      const b = world.geese[j];

      if (a === undefined || b === undefined || a.state !== "approach" || b.state !== "approach") {
        continue;
      }

      if (Math.abs(a.x - b.x) < 9 && Math.abs(a.z - b.z) < 3) {
        const push = a.z <= b.z ? -0.25 : 0.25;

        a.z = clamp(a.z + push, 0, STREET.depth);
        b.z = clamp(b.z - push, 0, STREET.depth);
      }
    }
  }
};

const spawnGeese = (world: StreetWorld, tuning: StreetTuning): void => {
  const up = world.hens.filter((hen) => !isHenDown(hen, world.tick)).length;

  if (world.hens.length === 0 || world.tick < world.nextSpawnTick) {
    return;
  }

  const wanted = tuning.geeseAtOnce + Math.max(0, up - 1);
  const live = world.geese.filter((goose) => goose.state !== "ko").length;

  if (live >= wanted) {
    return;
  }

  const side = world.nextSpawnSide;
  const lane = Math.floor(Math.random() * STREET.lanes);

  world.geese.push({
    id: world.nextGooseId,
    x: side < 0 ? -8 : STREET.width + 8,
    z: tuning.depthMode === "lanes" ? resolveLaneZ(lane) : Math.random() * STREET.depth,
    facing: side < 0 ? 1 : -1,
    state: "enter",
    until: 0,
    bornTick: world.tick
  });
  world.nextGooseId += 1;
  world.nextSpawnSide = side < 0 ? 1 : -1;
  world.nextSpawnTick = world.tick + SPAWN_GAP_TICKS;
};

/** One sixtieth of a second of street. */
export const stepStreet = (world: StreetWorld, tuning: StreetTuning): void => {
  world.tick += 1;

  for (const hen of world.hens) {
    stepHen(world, hen, tuning);
  }

  for (const goose of world.geese) {
    stepGoose(world, goose, tuning);
  }

  separateGeese(world);
  world.geese = world.geese.filter((goose) => goose.state !== "ko" || world.tick < goose.until);
  spawnGeese(world, tuning);
};

export type HenPoseName = "idle" | "walk" | "peck" | "hurt" | "ko";

export const resolveHenPose = (hen: StreetHen, tick: number): HenPoseName => {
  if (isHenDown(hen, tick)) {
    return "ko";
  }

  if (tick < hen.hurtUntil) {
    return "hurt";
  }

  if (tick < hen.peckUntil) {
    return "peck";
  }

  return hen.moving ? "walk" : "idle";
};
