import type { BrawlGoonState, BrawlHazard } from "../../types.js";
import { isBrawlGoonGuarded } from "../../world/index.js";
import type {
  BrawlCrewBlock,
  BrawlCrewEvent,
  BrawlCrewFrame,
  BrawlCrewGoon,
  BrawlCrewHen,
  BrawlCrewInput,
  BrawlCrewSpawn
} from "../types.js";
import { BRAWL_CREW_WALKS, BRAWL_CREW_WORLD, resolveBrawlCrewHenStart } from "../world/index.js";

const WORLD = BRAWL_CREW_WORLD;

const createHen = (slot: number, crew: number): BrawlCrewHen => {
  return {
    slot,
    ...resolveBrawlCrewHenStart(slot, crew),
    facing: 1,
    walk: 0,
    peckHeld: false,
    peckWantedUntilTick: -1,
    hearts: WORLD.heartsMax,
    state: "up",
    peckUntilTick: 0,
    peckCooldownUntilTick: 0,
    peckLanded: false,
    alignZ: null,
    hurtUntilTick: 0,
    invulnerableUntilTick: 0,
    reviveSinceTick: null,
    lastInputTick: 0,
    hitInWave: false,
    stats: { goons: 0, worth: 0, hits: 0, downs: 0, revives: 0 }
  };
};

/** The frame a block starts from: the crew on the line with three hearts each, the camera locked on wave 0. */
export const createBrawlCrewStart = (block: BrawlCrewBlock): BrawlCrewFrame => {
  return {
    tick: 0,
    hens: Array.from({ length: block.crew }, (_, slot) => createHen(slot, block.crew)),
    goons: [],
    pickups: [],
    cameraX: block.waves[0]?.lockX ?? 0,
    cameraLocked: true,
    waveIndex: 0,
    waveOpenedTick: 0,
    spawned: 0,
    wingDropped: false,
    banked: 0,
    events: [],
    outcome: null
  };
};

const signOf = (value: number, fallback: -1 | 1): -1 | 1 => {
  if (value > 0) {
    return 1;
  }

  return value < 0 ? -1 : fallback;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const isReeling = (hen: BrawlCrewHen, tick: number): boolean => tick < hen.hurtUntilTick;

/** Whether her beak is out at this tick, from the start of the peck to the end of its live window. */
export const isBrawlCrewHenPecking = (hen: Pick<BrawlCrewHen, "peckUntilTick">, tick: number): boolean => {
  return tick < hen.peckUntilTick;
};

const isPeckLive = (hen: BrawlCrewHen, tick: number): boolean => {
  return tick < hen.peckUntilTick && tick >= hen.peckUntilTick - WORLD.peckActiveTicks;
};

const isStanding = (goon: BrawlCrewGoon): boolean => goon.state !== "ko" && goon.state !== "gone";

const setHen = (frame: BrawlCrewFrame, hen: BrawlCrewHen): BrawlCrewFrame => {
  return { ...frame, hens: frame.hens.map((other) => (other.slot === hen.slot ? hen : other)) };
};

const withEvents = (frame: BrawlCrewFrame, events: readonly BrawlCrewEvent[]): BrawlCrewFrame => {
  return events.length === 0 ? frame : { ...frame, events: [...frame.events, ...events] };
};

/**
 * The thumbs, for the inputs stamped at exactly this frame's tick, in the order they came. A walk
 * moves the stick; a peck's press asks for a peck and its release lets go. Any input wakes a hen
 * who was away. A slot nobody is in is ignored.
 */
const applyInputs = (frame: BrawlCrewFrame, inputs: readonly BrawlCrewInput[]): BrawlCrewFrame => {
  let next = frame;

  for (const input of inputs) {
    const hen = next.hens[input.hen];

    if (input.tick !== frame.tick || hen === undefined) {
      continue;
    }

    const awake: BrawlCrewHen = {
      ...hen,
      lastInputTick: frame.tick,
      state: hen.state === "away" ? "up" : hen.state
    };

    if (input.kind === "walk") {
      next = setHen(next, { ...awake, walk: BRAWL_CREW_WALKS[input.dir] === undefined ? 0 : input.dir });
      continue;
    }

    next = setHen(next, {
      ...awake,
      peckHeld: input.held,
      peckWantedUntilTick: input.held ? frame.tick + WORLD.peckBufferTicks : awake.peckWantedUntilTick
    });
  }

  return next;
};

/**
 * The line of the goon a peck opening now is for: the nearest one standing in the peck's reach
 * (and a little past it, so a goon about to arrive counts) within `peckDepthBand` of her line.
 * She slides onto that line while the peck is out, so the beak meets it.
 */
const resolveAlignLine = (hen: BrawlCrewHen, goons: readonly BrawlCrewGoon[]): number | null => {
  let best: BrawlCrewGoon | null = null;
  let bestScore = 0;

  for (const goon of goons) {
    if (!isStanding(goon) || goon.state === "entering") {
      continue;
    }

    const { halfWidth } = WORLD.goons[goon.kind];
    const ahead = (goon.x - hen.x) * hen.facing;
    const off = Math.abs(goon.z - hen.z);

    if (ahead < -WORLD.henRadius - halfWidth || ahead > WORLD.henRadius + WORLD.peckReach + halfWidth + 4) {
      continue;
    }

    if (off > WORLD.peckDepthBand) {
      continue;
    }

    const score = off * 2 + Math.abs(ahead);

    if (best === null || score < bestScore) {
      best = goon;
      bestScore = score;
    }
  }

  return best === null ? null : best.z;
};

/**
 * One hen, one tick of her own: she sits down if her pad has been neutral and silent for
 * `awayTicks`; a wanted peck opens once the cooldown and any reel allow; and she walks where the
 * stick points — slower while the beak is out, and across the band toward her peck's line rather
 * than where the stick says while she has one. She faces the way she walks along the street, never
 * the way she pecks.
 */
const stepHen = (hen: BrawlCrewHen, frame: BrawlCrewFrame, tick: number): BrawlCrewHen => {
  if (hen.state !== "up") {
    return hen;
  }

  if (hen.walk === 0 && !hen.peckHeld && tick - hen.lastInputTick >= WORLD.awayTicks) {
    return { ...hen, state: "away", alignZ: null, peckWantedUntilTick: -1 };
  }

  let next = hen;
  // A press opens a peck as soon as the cooldown allows; a thumb merely left down waits a rest longer.
  const isPressed = tick <= hen.peckWantedUntilTick && tick >= hen.peckCooldownUntilTick;
  const isRepeat = hen.peckHeld && tick >= hen.peckCooldownUntilTick + WORLD.peckHoldRestTicks;

  if ((isPressed || isRepeat) && !isReeling(hen, tick)) {
    next = {
      ...next,
      peckUntilTick: tick + WORLD.peckDelayTicks + WORLD.peckActiveTicks,
      peckCooldownUntilTick: tick + WORLD.peckCooldownTicks,
      peckWantedUntilTick: -1,
      peckLanded: false,
      alignZ: resolveAlignLine(hen, frame.goons)
    };
  }

  const pecking = isBrawlCrewHenPecking(next, tick);

  if (!pecking && next.alignZ !== null) {
    next = { ...next, alignZ: null };
  }

  if (isReeling(next, tick)) {
    return next;
  }

  const step = BRAWL_CREW_WALKS[next.walk];
  const share = pecking ? WORLD.peckWalkShare : 1;
  const isDiagonal = step.x !== 0 && step.z !== 0;
  const dx = step.x * (isDiagonal ? WORLD.henDiagonalX : WORLD.henWalkSpeed) * share;
  const dz =
    next.alignZ !== null
      ? clamp(next.alignZ - next.z, -WORLD.alignSpeed, WORLD.alignSpeed)
      : step.z * (isDiagonal ? WORLD.henDiagonalZ : WORLD.henDepthSpeed) * share;

  if (dx === 0 && dz === 0) {
    return next;
  }

  return {
    ...next,
    x: next.x + dx,
    z: clamp(next.z + dz, 0, WORLD.depth),
    facing: step.x === 0 ? next.facing : step.x
  };
};

/** Where the camera's left edge may go no further right than: the next wave's lock, or the last screen. */
const resolveCameraLimit = (frame: BrawlCrewFrame, block: BrawlCrewBlock): number => {
  return block.waves[frame.waveIndex]?.lockX ?? block.length - WORLD.width;
};

/**
 * Between waves the camera follows the up hen furthest along, rightward only, and locks — opening
 * the next wave and wiping every hen's clean slate for it — the tick its left edge reaches that
 * wave's lock.
 */
const moveCamera = (frame: BrawlCrewFrame, block: BrawlCrewBlock, tick: number): BrawlCrewFrame => {
  if (frame.cameraLocked) {
    return frame;
  }

  let lead: number | null = null;

  for (const hen of frame.hens) {
    if (hen.state === "up" && (lead === null || hen.x > lead)) {
      lead = hen.x;
    }
  }

  if (lead === null) {
    return frame;
  }

  const limit = resolveCameraLimit(frame, block);
  const target = Math.min(limit, lead - WORLD.width * WORLD.cameraLeadShare);
  const cameraX = target > frame.cameraX ? Math.min(target, frame.cameraX + WORLD.cameraUnlockSpeed) : frame.cameraX;

  if (cameraX >= limit && frame.waveIndex < block.waves.length) {
    return {
      ...frame,
      cameraX: limit,
      cameraLocked: true,
      waveOpenedTick: tick,
      wingDropped: false,
      hens: frame.hens.map((hen) => (hen.hitInWave ? { ...hen, hitInWave: false } : hen))
    };
  }

  return cameraX === frame.cameraX ? frame : { ...frame, cameraX };
};

/**
 * Nobody leaves the window: a hen at its left edge is walked along by the camera, and a downed or
 * sitting one is slid along it, so no hen is ever left where a teammate cannot reach her.
 */
const clampHens = (frame: BrawlCrewFrame): BrawlCrewFrame => {
  const min = frame.cameraX + WORLD.henMargin;
  const max = frame.cameraX + WORLD.width - WORLD.henMargin;

  if (frame.hens.every((hen) => hen.x >= min && hen.x <= max)) {
    return frame;
  }

  return { ...frame, hens: frame.hens.map((hen) => (hen.x < min || hen.x > max ? { ...hen, x: clamp(hen.x, min, max) } : hen)) };
};

const createGoon = (spawn: BrawlCrewSpawn, block: BrawlCrewBlock, cameraX: number): BrawlCrewGoon => {
  const { halfWidth, hp } = WORLD.goons[spawn.kind];
  const lead = halfWidth + WORLD.spawnLead;

  return {
    spawnIndex: spawn.index,
    kind: spawn.kind,
    x: spawn.side === -1 ? cameraX - lead : cameraX + WORLD.width + lead,
    z: spawn.z,
    y: spawn.kind === "gull" ? WORLD.gullCruiseY : 0,
    vx: 0,
    vy: 0,
    facing: spawn.side === -1 ? 1 : -1,
    hp: spawn.kind === "boss" ? block.bossHp : hp,
    state: "entering",
    stateUntilTick: 0,
    koTick: null,
    target: null
  };
};

/**
 * Every spawn of the wave in hand whose time has come steps in from its edge — while there is a
 * place on the street. Past `standingCap` the rest wait their turn, so a big crew's wave is paced
 * by how fast it puts geese down, not by a clock.
 */
const spawnGoons = (frame: BrawlCrewFrame, block: BrawlCrewBlock, tick: number): BrawlCrewFrame => {
  const wave = block.waves[frame.waveIndex];

  if (wave === undefined || !frame.cameraLocked) {
    return frame;
  }

  const waveEnd = (wave.spawns[wave.spawns.length - 1]?.index ?? -1) + 1;
  let spawned = frame.spawned;
  let standing = frame.goons.filter(isStanding).length;
  const arrivals: BrawlCrewGoon[] = [];

  while (spawned < waveEnd && standing < block.standingCap) {
    const spawn = block.spawns[spawned];

    if (spawn === undefined || spawn.atTick > tick - frame.waveOpenedTick) {
      break;
    }

    arrivals.push(createGoon(spawn, block, frame.cameraX));
    spawned += 1;
    standing += 1;
  }

  return arrivals.length === 0 ? frame : { ...frame, spawned, goons: [...frame.goons, ...arrivals] };
};

/**
 * Whose goon this is: the up hen with the fewest goons on her already, then the nearest (depth
 * counted double, because a goon crosses the band slowly), then the lowest slot. Everyone gets
 * geese, and nobody gets all of them.
 */
const pickTarget = (goon: BrawlCrewGoon, hens: readonly BrawlCrewHen[], load: readonly number[]): number | null => {
  let best: BrawlCrewHen | null = null;
  let bestLoad = 0;
  let bestDistance = 0;

  for (const hen of hens) {
    if (hen.state !== "up") {
      continue;
    }

    const henLoad = load[hen.slot] ?? 0;
    const distance = Math.abs(hen.x - goon.x) + Math.abs(hen.z - goon.z) * 2;

    if (best === null || henLoad < bestLoad || (henLoad === bestLoad && distance < bestDistance)) {
      best = hen;
      bestLoad = henLoad;
      bestDistance = distance;
    }
  }

  return best === null ? null : best.slot;
};

/** A gull that is not diving climbs back to its cruise; everything else stands on the street. */
const settleHeight = (goon: BrawlCrewGoon): number => {
  if (goon.kind !== "gull") {
    return 0;
  }

  return Math.min(WORLD.gullCruiseY, goon.y + WORLD.gullClimb);
};

/** A goon that has stepped in stays inside the locked window, and always inside the band. */
const clampGoon = (goon: BrawlCrewGoon, frame: BrawlCrewFrame): BrawlCrewGoon => {
  const z = clamp(goon.z, 0, WORLD.depth);

  if (goon.state === "entering" || !frame.cameraLocked) {
    return z === goon.z ? goon : { ...goon, z };
  }

  const { halfWidth } = WORLD.goons[goon.kind];
  const x = clamp(goon.x, frame.cameraX + halfWidth, frame.cameraX + WORLD.width - halfWidth);

  return x === goon.x && z === goon.z ? goon : { ...goon, x, z };
};

const enterGoon = (goon: BrawlCrewGoon, frame: BrawlCrewFrame): BrawlCrewGoon => {
  const stats = WORLD.goons[goon.kind];
  const x = goon.x + goon.facing * stats.speed;
  const isInside = x >= frame.cameraX + stats.halfWidth && x <= frame.cameraX + WORLD.width - stats.halfWidth;

  return { ...goon, x, state: isInside ? "approach" : "entering" };
};

/**
 * Whether a walker's next step toward its hen would bring it up close behind another walker that
 * is on the SAME hen, already nearer her on the same side and on much the same line: they queue
 * rather than stack. Only behind its own hen's goons — two goons on different hens can each be
 * standing between the other and its hen, and would wait on each other for ever.
 */
const isQueued = (goon: BrawlCrewGoon, nextX: number, henX: number, goons: readonly BrawlCrewGoon[]): boolean => {
  const side = signOf(goon.x - henX, 1);
  const distance = (goon.x - henX) * side;

  return goons.some((other) => {
    if (other.spawnIndex === goon.spawnIndex || other.kind === "gull" || !isStanding(other) || other.state === "entering") {
      return false;
    }

    if (other.target !== goon.target || Math.abs(other.z - goon.z) >= WORLD.goonQueueBand) {
      return false;
    }

    const otherDistance = (other.x - henX) * side;

    return otherDistance >= 0 && otherDistance < distance && (nextX - other.x) * side < WORLD.goonSpacing;
  });
};

/** The honk: it stops dead, facing her, and the room has `telegraphTicks` to shout. */
const startTelegraph = (goon: BrawlCrewGoon, facing: -1 | 1, tick: number): BrawlCrewGoon => {
  return { ...goon, facing, vx: 0, state: "telegraph", stateUntilTick: tick + WORLD.goons[goon.kind].telegraphTicks };
};

/** Whether the hen is facing this goon, whose own `facing` is toward her. */
const isFacedBy = (hen: BrawlCrewHen, facing: -1 | 1): boolean => hen.facing === -facing;

/**
 * Closing on its hen, the classic way: get onto her line from a standoff, then walk in along it,
 * then honk. In its reach and on her line a swan she is facing stands and stalks instead. A gull
 * has no standoff — it flies straight for the spot above her line.
 */
const approachGoon = (goon: BrawlCrewGoon, hen: BrawlCrewHen, frame: BrawlCrewFrame, tick: number): BrawlCrewGoon => {
  const stats = WORLD.goons[goon.kind];
  const facing = signOf(hen.x - goon.x, goon.facing);
  const distance = (hen.x - goon.x) * facing;
  const off = hen.z - goon.z;
  const isLined = Math.abs(off) <= WORLD.goonLineBand;
  const settled: BrawlCrewGoon = { ...goon, y: settleHeight(goon), facing };

  if (distance <= stats.reach && isLined) {
    if (goon.kind === "swan" && isFacedBy(hen, facing)) {
      return { ...settled, vx: 0, state: "stalk" };
    }

    return startTelegraph(settled, facing, tick);
  }

  const lineSpeed = stats.speed * WORLD.goonLineSpeedShare;
  const z = goon.z + clamp(off, -lineSpeed, lineSpeed);
  const holdAt = isLined || goon.kind === "gull" ? stats.reach : stats.reach + WORLD.goonStandoff;
  const nextX = goon.x + facing * stats.speed;
  const isWalkingIn = distance > holdAt && (goon.kind === "gull" || !isQueued(goon, nextX, hen.x, frame.goons));

  return isWalkingIn ? { ...settled, x: nextX, z, vx: facing * stats.speed } : { ...settled, z, vx: 0 };
};

/**
 * The swan's stalk: faced, it stands at its reach and waits, and can be pecked — by her or by a
 * teammate, which is the crew's answer to it. The tick she turns her back it hisses, committed
 * from there. Faced but out of its reach or off her line, it goes back to closing on her.
 */
const stalkGoon = (goon: BrawlCrewGoon, hen: BrawlCrewHen, tick: number): BrawlCrewGoon => {
  const facing = signOf(hen.x - goon.x, goon.facing);

  if (!isFacedBy(hen, facing)) {
    return startTelegraph(goon, facing, tick);
  }

  const isInReach = (hen.x - goon.x) * facing <= WORLD.goons[goon.kind].reach;

  if (!isInReach || Math.abs(hen.z - goon.z) > WORLD.goonLineBand) {
    return { ...goon, facing, state: "approach" };
  }

  return goon.facing === facing && goon.vx === 0 ? goon : { ...goon, facing, vx: 0 };
};

/** The gull's dive starts going down at the speed that brings it back to its cruise on the last tick. */
const resolveDiveVy = (): number => {
  return (-WORLD.gullDiveGravity * (WORLD.goons.gull.attackTicks - 1)) / 2;
};

/** The lunge: straight along its own line, through whoever is on it, and out the other side. */
const attackGoon = (goon: BrawlCrewGoon, tick: number): BrawlCrewGoon => {
  const stats = WORLD.goons[goon.kind];
  const x = goon.x + goon.facing * stats.lunge;

  if (tick >= goon.stateUntilTick) {
    return {
      ...goon,
      x,
      y: goon.kind === "gull" ? WORLD.gullCruiseY : 0,
      vx: 0,
      vy: 0,
      state: "recover",
      stateUntilTick: tick + stats.recoverTicks
    };
  }

  if (goon.kind !== "gull") {
    return { ...goon, x, vx: goon.facing * stats.lunge };
  }

  return { ...goon, x, y: Math.max(0, goon.y + goon.vy), vx: goon.facing * stats.lunge, vy: goon.vy + WORLD.gullDiveGravity };
};

/** The timed states: telegraph into attack, recover and stunned back to approach, ko to gone. */
const stepTimedGoon = (goon: BrawlCrewGoon, tick: number): BrawlCrewGoon => {
  const stats = WORLD.goons[goon.kind];

  if (goon.state === "ko") {
    return tick >= goon.stateUntilTick ? { ...goon, state: "gone" } : { ...goon, y: Math.max(0, goon.y - WORLD.gullClimb * 2) };
  }

  if (tick < goon.stateUntilTick) {
    return goon.y === settleHeight(goon) ? goon : { ...goon, y: settleHeight(goon) };
  }

  if (goon.state === "telegraph") {
    const vy = goon.kind === "gull" ? resolveDiveVy() : 0;

    return { ...goon, vy, vx: goon.facing * stats.lunge, state: "attack", stateUntilTick: tick + stats.attackTicks };
  }

  return { ...goon, state: "approach" };
};

const stepGoon = (goon: BrawlCrewGoon, frame: BrawlCrewFrame, tick: number): BrawlCrewGoon => {
  if (goon.state === "entering") {
    return enterGoon(goon, frame);
  }

  if (goon.state === "attack") {
    return clampGoon(attackGoon(goon, tick), frame);
  }

  if (goon.state !== "approach" && goon.state !== "stalk") {
    return stepTimedGoon(goon, tick);
  }

  const hen = goon.target === null ? undefined : frame.hens[goon.target];

  if (hen === undefined) {
    // Nobody up to be on: it stands where it is until somebody is.
    const y = settleHeight(goon);

    return goon.y === y && goon.vx === 0 && goon.state === "approach" ? goon : { ...goon, y, vx: 0, state: "approach" };
  }

  return clampGoon(goon.state === "stalk" ? stalkGoon(goon, hen, tick) : approachGoon(goon, hen, frame, tick), frame);
};

/**
 * Every goon, one tick of its script. A goon with nobody to be on — it has just stepped in, or its
 * hen went down or sat out — picks again first, in spawn order, each pick counted before the next
 * goon picks, so a downed hen's geese spread over her teammates rather than all landing on one.
 */
const stepGoons = (frame: BrawlCrewFrame, tick: number): BrawlCrewFrame => {
  if (frame.goons.length === 0) {
    return frame;
  }

  const load = frame.hens.map(() => 0);

  for (const goon of frame.goons) {
    if (isStanding(goon) && goon.target !== null && frame.hens[goon.target]?.state === "up") {
      load[goon.target] = (load[goon.target] ?? 0) + 1;
    }
  }

  const goons = frame.goons.map((goon): BrawlCrewGoon => {
    if (!isStanding(goon)) {
      return stepGoon(goon, frame, tick);
    }

    if (goon.target !== null && frame.hens[goon.target]?.state === "up") {
      return stepGoon(goon, frame, tick);
    }

    const target = pickTarget(goon, frame.hens, load);

    if (target !== null) {
      load[target] = (load[target] ?? 0) + 1;
    }

    // A swan stalking a hen who has gone down has nobody to stalk: it closes on its new one.
    const state: BrawlGoonState = goon.state === "stalk" ? "approach" : goon.state;

    return stepGoon({ ...goon, target, state }, frame, tick);
  });

  return { ...frame, goons };
};

/** Whether a goon's box overlaps the strip `left`..`right` along the street, low enough to reach. */
const isGoonIn = (goon: BrawlCrewGoon, left: number, right: number): boolean => {
  const { halfWidth } = WORLD.goons[goon.kind];

  return goon.x - halfWidth < right && goon.x + halfWidth > left && goon.y < WORLD.henHeight;
};

const CHAINABLE_STATES: readonly BrawlGoonState[] = ["approach", "stalk", "telegraph", "attack", "recover"];

/**
 * The chain: a goon shoved along the street bowls through every other walker whose box its path
 * crosses on much the same line, and each is stunned for its own `stunTicks` — no hp lost, no
 * movement, and no chain of its own.
 */
const chainKnockback = (
  goons: readonly BrawlCrewGoon[],
  shoved: BrawlCrewGoon,
  fromX: number,
  tick: number
): { goons: BrawlCrewGoon[]; bumped: number[] } => {
  const { halfWidth } = WORLD.goons[shoved.kind];
  const left = Math.min(fromX, shoved.x) - halfWidth;
  const right = Math.max(fromX, shoved.x) + halfWidth;
  const bumped: number[] = [];
  const next = goons.map((goon): BrawlCrewGoon => {
    if (goon.spawnIndex === shoved.spawnIndex || goon.kind === "gull" || !CHAINABLE_STATES.includes(goon.state)) {
      return goon;
    }

    const stats = WORLD.goons[goon.kind];

    if (goon.x + stats.halfWidth <= left || goon.x - stats.halfWidth >= right) {
      return goon;
    }

    if (Math.abs(goon.z - shoved.z) > WORLD.peckDepthBand) {
      return goon;
    }

    bumped.push(goon.spawnIndex);

    return { ...goon, vx: 0, vy: 0, state: "stunned", stateUntilTick: tick + stats.stunTicks };
  });

  return { goons: next, bumped };
};

/** Whether a shove from `fromX` to `toX` touches the hazard's span. The hazard runs the band's whole depth. */
const isShovedThrough = (hazard: BrawlHazard, fromX: number, toX: number): boolean => {
  return Math.min(fromX, toX) <= hazard.x + hazard.width && Math.max(fromX, toX) >= hazard.x;
};

const isDunkable = (goon: BrawlCrewGoon): boolean => goon.kind !== "gull" && goon.kind !== "boss";

/**
 * One hen's beak: a box from her back edge to `peckReach` past her front, reaching `peckDepthBand`
 * either side of her line. The nearest goon standing in it takes the peck — a hp and a shove, then
 * a reel or the fall; a clank off a helmet goose's lowered guard; a dunk if the shove carries it
 * into the hazard — and whatever it is bowled through is stunned. A goon worth two or more that
 * goes down drops the wave's wing where it lands. Everything it banks is hers on the card and the
 * team's on the board.
 */
const resolvePeck = (frame: BrawlCrewFrame, block: BrawlCrewBlock, tick: number, slot: number): BrawlCrewFrame => {
  const hen = frame.hens[slot];

  if (hen === undefined || hen.state !== "up" || !isPeckLive(hen, tick) || hen.peckLanded) {
    return frame;
  }

  const reach = WORLD.henRadius + WORLD.peckReach;
  const left = hen.facing === 1 ? hen.x - WORLD.henRadius : hen.x - reach;
  const right = hen.facing === 1 ? hen.x + reach : hen.x + WORLD.henRadius;
  let target: BrawlCrewGoon | null = null;

  for (const goon of frame.goons) {
    if (!isStanding(goon) || goon.state === "entering" || !isGoonIn(goon, left, right)) {
      continue;
    }

    if (Math.abs(goon.z - hen.z) > WORLD.peckDepthBand) {
      continue;
    }

    if (target === null || Math.abs(goon.x - hen.x) < Math.abs(target.x - hen.x)) {
      target = goon;
    }
  }

  if (target === null) {
    return frame;
  }

  const struckIndex = target.spawnIndex;
  const stats = WORLD.goons[target.kind];
  const isClank = isBrawlGoonGuarded(target);
  const hp = isClank ? target.hp : target.hp - 1;
  const x = target.x + signOf(target.x - hen.x, hen.facing) * stats.knockback;
  const fall = (goon: BrawlCrewGoon): BrawlCrewGoon => ({
    ...goon,
    hp: 0,
    vx: 0,
    vy: 0,
    state: "ko",
    koTick: tick,
    stateUntilTick: tick + WORLD.koFallTicks
  });
  const struck: BrawlCrewGoon = isClank
    ? { ...target, x, vx: 0, vy: 0 }
    : hp <= 0
      ? fall({ ...target, x })
      : { ...target, hp, x, vx: 0, vy: 0, state: "stunned", stateUntilTick: tick + stats.stunTicks };
  const pinned = clampGoon(struck, frame);
  const isDunk = block.hazard !== null && isDunkable(target) && isShovedThrough(block.hazard, target.x, pinned.x);
  const shoved = isDunk && pinned.state !== "ko" ? fall(pinned) : pinned;
  const isDown = shoved.state === "ko";
  const chained = chainKnockback(
    frame.goons.map((goon) => (goon.spawnIndex === struckIndex ? shoved : goon)),
    shoved,
    target.x,
    tick
  );
  const isWingDrop = isDown && stats.worth >= 2 && frame.pickups.length === 0 && !frame.wingDropped;
  const events: BrawlCrewEvent[] = [{ tick, kind: "landed", hen: slot, spawnIndex: struckIndex }];

  if (isClank) {
    events.push({ tick, kind: "clank", hen: slot, spawnIndex: struckIndex });
  }

  if (isDunk) {
    events.push({ tick, kind: "dunk", hen: slot, spawnIndex: struckIndex });
  }

  if (isDown) {
    events.push({ tick, kind: "ko", hen: slot, spawnIndex: struckIndex });
  }

  for (const spawnIndex of chained.bumped) {
    events.push({ tick, kind: "bump", spawnIndex });
  }

  if (isWingDrop) {
    events.push({ tick, kind: "drop", spawnIndex: struckIndex });
  }

  const pecker: BrawlCrewHen = {
    ...hen,
    peckLanded: true,
    stats: isDown ? { ...hen.stats, goons: hen.stats.goons + 1, worth: hen.stats.worth + stats.worth } : hen.stats
  };

  return withEvents(
    {
      ...setHen(frame, pecker),
      goons: chained.goons,
      banked: isDown ? frame.banked + stats.worth : frame.banked,
      wingDropped: frame.wingDropped || isWingDrop,
      pickups: isWingDrop
        ? [
            {
              x: clamp(shoved.x, frame.cameraX + WORLD.henMargin, frame.cameraX + WORLD.width - WORLD.henMargin),
              z: shoved.z,
              untilTick: tick + WORLD.wingTicks
            }
          ]
        : frame.pickups
    },
    events
  );
};

/** Every hen's peck, in slot order: a goon one beak has put down is not there for the next. */
const resolvePecks = (frame: BrawlCrewFrame, block: BrawlCrewBlock, tick: number): BrawlCrewFrame => {
  let next = frame;

  for (const hen of frame.hens) {
    next = resolvePeck(next, block, tick, hen.slot);
  }

  return next;
};

/**
 * A goon mid-lunge whose box crosses a hen on its line costs her a heart, shoves her away from it,
 * reels her and shuts her beak; then she is invulnerable for a while. One lunge can go through
 * several hens standing in a row. A hen with no hearts left is down where she fell.
 */
const resolveHits = (frame: BrawlCrewFrame, tick: number): BrawlCrewFrame => {
  const attackers = frame.goons.filter((goon) => goon.state === "attack");

  if (attackers.length === 0) {
    return frame;
  }

  const events: BrawlCrewEvent[] = [];
  const min = frame.cameraX + WORLD.henMargin;
  const max = frame.cameraX + WORLD.width - WORLD.henMargin;
  const hens = frame.hens.map((hen): BrawlCrewHen => {
    if (hen.state !== "up" || tick < hen.invulnerableUntilTick) {
      return hen;
    }

    const attacker = attackers.find((goon) => {
      return (
        isGoonIn(goon, hen.x - WORLD.henRadius, hen.x + WORLD.henRadius) && Math.abs(goon.z - hen.z) <= WORLD.goonHitBand
      );
    });

    if (attacker === undefined) {
      return hen;
    }

    const hearts = hen.hearts - 1;
    const isDown = hearts <= 0;

    events.push({ tick, kind: "hit", hen: hen.slot, spawnIndex: attacker.spawnIndex });

    if (isDown) {
      events.push({ tick, kind: "down", hen: hen.slot });
    }

    return {
      ...hen,
      x: clamp(hen.x + signOf(hen.x - attacker.x, attacker.facing) * WORLD.hitKnockback, min, max),
      hearts: isDown ? 0 : hearts,
      state: isDown ? "down" : "up",
      hurtUntilTick: tick + WORLD.hurtTicks,
      invulnerableUntilTick: tick + WORLD.invulnerableTicks,
      peckUntilTick: Math.min(hen.peckUntilTick, tick),
      alignZ: null,
      reviveSinceTick: null,
      hitInWave: true,
      stats: { ...hen.stats, hits: hen.stats.hits + 1, downs: hen.stats.downs + (isDown ? 1 : 0) }
    };
  });

  return events.length === 0 ? frame : withEvents({ ...frame, hens }, events);
};

/** Standing over her: up, stick centred, beak shut and thumb off it, not reeling, and close. */
const canRevive = (reviver: BrawlCrewHen, fallen: BrawlCrewHen, tick: number): boolean => {
  return (
    reviver.state === "up" &&
    reviver.walk === 0 &&
    !reviver.peckHeld &&
    !isBrawlCrewHenPecking(reviver, tick) &&
    !isReeling(reviver, tick) &&
    Math.abs(reviver.x - fallen.x) <= WORLD.reviveReach &&
    Math.abs(reviver.z - fallen.z) <= WORLD.peckDepthBand
  );
};

/**
 * A downed hen gets up, on one heart and invulnerable for the window, once a teammate has stood
 * over her for `reviveTicks` without a break. The count is hers, not the teammate's: two standing
 * over her do not halve it, and the moment nobody is — a hit reels the one who was — it starts over.
 */
const resolveRevives = (frame: BrawlCrewFrame, tick: number): BrawlCrewFrame => {
  if (!frame.hens.some((hen) => hen.state === "down")) {
    return frame;
  }

  const events: BrawlCrewEvent[] = [];
  const credited: number[] = [];
  const hens = frame.hens.map((hen): BrawlCrewHen => {
    if (hen.state !== "down") {
      return hen;
    }

    const reviver = frame.hens.find((other) => other.slot !== hen.slot && canRevive(other, hen, tick));

    if (reviver === undefined) {
      return hen.reviveSinceTick === null ? hen : { ...hen, reviveSinceTick: null };
    }

    const since = hen.reviveSinceTick ?? tick;

    if (tick - since < WORLD.reviveTicks) {
      return hen.reviveSinceTick === since ? hen : { ...hen, reviveSinceTick: since };
    }

    events.push({ tick, kind: "revive", hen: hen.slot });
    credited.push(reviver.slot);

    return {
      ...hen,
      state: "up",
      hearts: WORLD.reviveHearts,
      hurtUntilTick: tick,
      invulnerableUntilTick: tick + WORLD.invulnerableTicks,
      peckUntilTick: tick,
      peckCooldownUntilTick: tick,
      reviveSinceTick: null,
      lastInputTick: tick
    };
  });

  if (credited.length === 0) {
    return hens.every((hen, index) => hen === frame.hens[index]) ? frame : { ...frame, hens };
  }

  return withEvents(
    {
      ...frame,
      hens: hens.map((hen) => {
        const revives = credited.filter((slot) => slot === hen.slot).length;

        return revives === 0 ? hen : { ...hen, stats: { ...hen.stats, revives: hen.stats.revives + revives } };
      })
    },
    events
  );
};

/**
 * The wing on the street: gone at its `untilTick`, and eaten by the first hen STANDING on it with
 * a heart to fill — a heart back, up to three. Stopping in the fight is the price.
 */
const resolvePickups = (frame: BrawlCrewFrame, tick: number): BrawlCrewFrame => {
  if (frame.pickups.length === 0) {
    return frame;
  }

  const live = frame.pickups.filter((pickup) => pickup.untilTick > tick);
  const reach = WORLD.henRadius + WORLD.wingReach;
  let next: BrawlCrewFrame = live.length === frame.pickups.length ? frame : { ...frame, pickups: live };

  for (const pickup of live) {
    const eater = next.hens.find((hen) => {
      return (
        hen.state === "up" &&
        hen.walk === 0 &&
        hen.hearts < WORLD.heartsMax &&
        Math.abs(hen.x - pickup.x) <= reach &&
        Math.abs(hen.z - pickup.z) <= WORLD.peckDepthBand
      );
    });

    if (eater === undefined) {
      continue;
    }

    next = withEvents(
      { ...setHen(next, { ...eater, hearts: eater.hearts + 1 }), pickups: next.pickups.filter((other) => other !== pickup) },
      [{ tick, kind: "wing", hen: eater.slot }]
    );
  }

  return next;
};

/** The fallen are swept off the street and the events older than the window out of the frame. */
const tidy = (frame: BrawlCrewFrame, tick: number): BrawlCrewFrame => {
  const hasGone = frame.goons.some((goon) => goon.state === "gone");
  const oldest = tick - WORLD.eventWindowTicks;
  const hasOld = frame.events.some((event) => event.tick < oldest);

  if (!hasGone && !hasOld) {
    return frame;
  }

  return {
    ...frame,
    goons: hasGone ? frame.goons.filter((goon) => goon.state !== "gone") : frame.goons,
    events: hasOld ? frame.events.filter((event) => event.tick >= oldest) : frame.events
  };
};

/**
 * The wave is down when every one of its spawns has stepped in and none is still standing. The
 * camera lets go, and every hen who is up and was not hit in it banks the clean-wave bonus.
 */
const resolveWaveDown = (frame: BrawlCrewFrame, block: BrawlCrewBlock): BrawlCrewFrame => {
  const wave = block.waves[frame.waveIndex];

  if (wave === undefined || !frame.cameraLocked) {
    return frame;
  }

  const waveEnd = (wave.spawns[wave.spawns.length - 1]?.index ?? -1) + 1;

  if (frame.spawned < waveEnd || frame.goons.some(isStanding)) {
    return frame;
  }

  const clean = frame.hens.filter((hen) => hen.state === "up" && !hen.hitInWave);

  return withEvents(
    {
      ...frame,
      cameraLocked: false,
      waveIndex: frame.waveIndex + 1,
      banked: frame.banked + clean.length * WORLD.cleanWaveBonus
    },
    clean.map((hen) => ({ tick: frame.tick, kind: "bonus", hen: hen.slot }))
  );
};

/** What the hens still up at the clear carry off: a heart's worth for each heart, to three a hen. */
export const resolveBrawlCrewHeartsCarried = (hens: readonly Pick<BrawlCrewHen, "state" | "hearts">[]): number => {
  return hens.reduce((total, hen) => {
    return hen.state === "up" ? total + Math.min(hen.hearts, WORLD.heartsMax) * WORLD.heartWorth : total;
  }, 0);
};

const resolveOutcome = (frame: BrawlCrewFrame, block: BrawlCrewBlock): BrawlCrewFrame => {
  const isAnyUp = frame.hens.some((hen) => hen.state === "up");

  // Everyone who is playing is down at once: the geese carry the crew to the bay. A crew that is
  // all sat out is nobody playing, not a wipe; the bell ends that block.
  if (!isAnyUp && frame.hens.some((hen) => hen.state === "down")) {
    return { ...frame, outcome: "wipe" };
  }

  if (frame.waveIndex >= block.waves.length && frame.hens.some((hen) => hen.state === "up" && hen.x >= block.exitX)) {
    return { ...frame, banked: frame.banked + resolveBrawlCrewHeartsCarried(frame.hens), outcome: "cleared" };
  }

  if (frame.tick >= WORLD.blockTicks) {
    return { ...frame, outcome: "timeout" };
  }

  return frame;
};

/**
 * The whole fight, one tick. A terminal frame steps to itself. The inputs stamped at this frame's
 * tick apply first; then the hens walk and open their pecks, the camera follows or holds, the
 * wave's goons step in and run their scripts, the pecks land, the lunges land, the fallen are
 * stood over, a wing is eaten, and the wave and the block are checked for their ends.
 */
export const stepBrawlCrew = (
  frame: BrawlCrewFrame,
  block: BrawlCrewBlock,
  inputs: readonly BrawlCrewInput[]
): BrawlCrewFrame => {
  if (frame.outcome !== null) {
    return frame;
  }

  const tick = frame.tick + 1;
  const thumbed = applyInputs(frame, inputs);
  const walked: BrawlCrewFrame = { ...thumbed, tick, hens: thumbed.hens.map((hen) => stepHen(hen, thumbed, tick)) };
  const placed = spawnGoons(clampHens(moveCamera(walked, block, tick)), block, tick);
  const pecked = resolvePecks(stepGoons(placed, tick), block, tick);
  const fought = resolvePickups(resolveRevives(resolveHits(pecked, tick), tick), tick);

  return resolveOutcome(resolveWaveDown(tidy(fought, tick), block), block);
};

/**
 * Steps `frame` up to `toTick`, or to a terminal frame, applying the thumbs from `inputs` as it
 * goes. An input stamped at tick T applies to the step that produces T + 1. Inputs earlier than
 * the frame are already in it (the thumbs' state is part of the frame) and are skipped.
 */
export const advanceBrawlCrew = (
  frame: BrawlCrewFrame,
  block: BrawlCrewBlock,
  inputs: readonly BrawlCrewInput[],
  toTick: number
): BrawlCrewFrame => {
  let current = frame;
  let cursor = 0;

  while (cursor < inputs.length && (inputs[cursor]?.tick ?? 0) < current.tick) {
    cursor += 1;
  }

  while (current.tick < toTick && current.outcome === null) {
    const from = cursor;

    while (cursor < inputs.length && inputs[cursor]?.tick === current.tick) {
      cursor += 1;
    }

    current = stepBrawlCrew(current, block, from === cursor ? [] : inputs.slice(from, cursor));
  }

  return current;
};
