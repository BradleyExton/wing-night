import type {
  BrawlBlock,
  BrawlCourse,
  BrawlFrame,
  BrawlGoon,
  BrawlGoonState,
  BrawlHazard,
  BrawlInput,
  BrawlRun,
  BrawlSpawn
} from "../types.js";
import {
  BRAWL_WORLD,
  isBrawlGoonGuarded,
  resolveBrawlBlock,
  resolveBrawlHeartsCap,
  resolveBrawlTickCap
} from "../world/index.js";

/**
 * The frame a block starts from: the hen on the line with the block's hearts (three, or four if
 * the team bought one at the handoff), the camera locked on wave 0.
 */
export const createBrawlRunStart = (block: BrawlBlock): BrawlFrame => {
  return {
    tick: 0,
    x: BRAWL_WORLD.henStartX,
    facing: 1,
    walking: 0,
    hearts: block.hearts,
    invulnerableUntilTick: 0,
    peckUntilTick: 0,
    peckCooldownUntilTick: 0,
    hurtUntilTick: 0,
    cameraX: block.waves[0]?.lockX ?? 0,
    cameraLocked: true,
    waveIndex: 0,
    waveOpenedTick: 0,
    spawned: 0,
    goons: [],
    goonsDown: 0,
    hits: [],
    landed: [],
    kos: [],
    bonuses: [],
    bumps: [],
    clanks: [],
    dunks: [],
    pickups: [],
    drops: [],
    wings: [],
    outcome: null
  };
};

/** The frame a block settles on when nobody fought it: on the line, the bell already rung, nothing banked. */
export const createBrawlRunSkip = (block: BrawlBlock): BrawlFrame => {
  return { ...createBrawlRunStart(block), outcome: "timeout" };
};

const signOf = (value: number, fallback: -1 | 1): -1 | 1 => {
  if (value > 0) {
    return 1;
  }

  return value < 0 ? -1 : fallback;
};

const isReeling = (frame: BrawlFrame, tick: number): boolean => tick < frame.hurtUntilTick;

/**
 * The thumbs, for the inputs logged at exactly this frame's tick. A walk sets the thumb; a peck
 * opens one if the cooldown has run out and she is not reeling. Several may share a tick — a
 * walk and a peck often do — and they apply in log order.
 */
const applyInputs = (frame: BrawlFrame, inputs: readonly BrawlInput[]): BrawlFrame => {
  let next = frame;

  for (const input of inputs) {
    if (input.tick !== frame.tick) {
      continue;
    }

    if (input.kind === "walk") {
      next = { ...next, walking: input.dir };
      continue;
    }

    if (frame.tick >= next.peckCooldownUntilTick && !isReeling(next, frame.tick)) {
      next = {
        ...next,
        peckUntilTick: frame.tick + BRAWL_WORLD.peckDelayTicks + BRAWL_WORLD.peckActiveTicks,
        peckCooldownUntilTick: frame.tick + BRAWL_WORLD.peckCooldownTicks
      };
    }
  }

  return next;
};

/** Where the camera's left edge may go no further right than: the next wave's lock, or the last screen. */
const resolveCameraLimit = (frame: BrawlFrame, block: BrawlBlock): number => {
  return block.waves[frame.waveIndex]?.lockX ?? block.length - BRAWL_WORLD.width;
};

/**
 * Between waves the camera follows the hen rightward, never left, at up to `cameraUnlockSpeed`,
 * and locks — opening the next wave — the tick its left edge reaches that wave's `lockX`.
 */
const moveCamera = (frame: BrawlFrame, block: BrawlBlock, tick: number): BrawlFrame => {
  if (frame.cameraLocked) {
    return frame;
  }

  const limit = resolveCameraLimit(frame, block);
  const target = Math.min(limit, frame.x - BRAWL_WORLD.width * BRAWL_WORLD.cameraLeadShare);
  const cameraX =
    target > frame.cameraX ? Math.min(target, frame.cameraX + BRAWL_WORLD.cameraUnlockSpeed) : frame.cameraX;

  if (cameraX >= limit && frame.waveIndex < block.waves.length) {
    return { ...frame, cameraX: limit, cameraLocked: true, waveOpenedTick: tick };
  }

  return { ...frame, cameraX };
};

/**
 * The hen walks while the thumb is down and she is not reeling, and faces the way she walks —
 * never the way she pecks, so a goon behind her needs a step back.
 */
const moveHen = (frame: BrawlFrame, tick: number): BrawlFrame => {
  if (frame.walking === 0 || isReeling(frame, tick)) {
    return frame;
  }

  return { ...frame, x: frame.x + frame.walking * BRAWL_WORLD.henWalkSpeed, facing: frame.walking };
};

const clampHen = (frame: BrawlFrame): BrawlFrame => {
  const { width, henMargin } = BRAWL_WORLD;
  const x = Math.max(frame.cameraX + henMargin, Math.min(frame.cameraX + width - henMargin, frame.x));

  return x === frame.x ? frame : { ...frame, x };
};

const createGoon = (spawn: BrawlSpawn, cameraX: number): BrawlGoon => {
  const { halfWidth, hp } = BRAWL_WORLD.goons[spawn.kind];
  const lead = halfWidth + BRAWL_WORLD.spawnLead;

  return {
    spawnIndex: spawn.index,
    kind: spawn.kind,
    // A lead past the edge it comes in from, so it walks into the tablet's frame rather than
    // appearing in it — and the wall, which sees past that edge, watches it coming first.
    x: spawn.side === -1 ? cameraX - lead : cameraX + BRAWL_WORLD.width + lead,
    y: spawn.kind === "gull" ? BRAWL_WORLD.gullCruiseY : 0,
    vx: 0,
    vy: 0,
    facing: spawn.side === -1 ? 1 : -1,
    hp,
    state: "entering",
    stateUntilTick: 0,
    koTick: null
  };
};

/** Every spawn of the wave in hand whose `atTick` has come steps in at the camera's edge. */
const spawnGoons = (frame: BrawlFrame, block: BrawlBlock, tick: number): BrawlFrame => {
  const wave = block.waves[frame.waveIndex];

  if (wave === undefined || !frame.cameraLocked) {
    return frame;
  }

  const waveEnd = (wave.spawns[wave.spawns.length - 1]?.index ?? -1) + 1;
  let spawned = frame.spawned;
  const arrivals: BrawlGoon[] = [];

  while (spawned < waveEnd) {
    const spawn = block.spawns[spawned];

    if (spawn === undefined || spawn.atTick > tick - frame.waveOpenedTick) {
      break;
    }

    arrivals.push(createGoon(spawn, frame.cameraX));
    spawned += 1;
  }

  return arrivals.length === 0 ? frame : { ...frame, spawned, goons: [...frame.goons, ...arrivals] };
};

const isStanding = (goon: BrawlGoon): boolean => goon.state !== "ko" && goon.state !== "gone";

/**
 * Whether a walking goon's next step toward the hen would bring it up close behind another
 * walker that is already nearer her on the same side: they queue rather than stack. Gulls are
 * in the air and queue for nobody.
 */
const isQueued = (goon: BrawlGoon, nextX: number, henX: number, goons: readonly BrawlGoon[]): boolean => {
  if (goon.kind === "gull") {
    return false;
  }

  const side = signOf(goon.x - henX, 1);
  const distance = (goon.x - henX) * side;

  return goons.some((other) => {
    if (other === goon || other.kind === "gull" || !isStanding(other) || other.state === "entering") {
      return false;
    }

    const otherDistance = (other.x - henX) * side;

    return otherDistance >= 0 && otherDistance < distance && (nextX - other.x) * side < BRAWL_WORLD.goonSpacing;
  });
};

/** A gull that is not diving climbs back to its cruise; everything else stands on the street. */
const settleHeight = (goon: BrawlGoon): number => {
  if (goon.kind !== "gull") {
    return 0;
  }

  return Math.min(BRAWL_WORLD.gullCruiseY, goon.y + BRAWL_WORLD.gullClimb);
};

/** The window a goon that has stepped in stays inside while the camera is locked. */
const clampGoon = (goon: BrawlGoon, frame: BrawlFrame): BrawlGoon => {
  if (goon.state === "entering" || !frame.cameraLocked) {
    return goon;
  }

  const { halfWidth } = BRAWL_WORLD.goons[goon.kind];
  const x = Math.max(frame.cameraX + halfWidth, Math.min(frame.cameraX + BRAWL_WORLD.width - halfWidth, goon.x));

  return x === goon.x ? goon : { ...goon, x };
};

const enterGoon = (goon: BrawlGoon, frame: BrawlFrame): BrawlGoon => {
  const stats = BRAWL_WORLD.goons[goon.kind];
  const x = goon.x + goon.facing * stats.speed;
  const isInside = x >= frame.cameraX + stats.halfWidth && x <= frame.cameraX + BRAWL_WORLD.width - stats.halfWidth;

  return { ...goon, x, state: isInside ? "approach" : "entering" };
};

/**
 * Whether the hen is facing this goon: a swan she faces stalks instead of hissing. `facing` is
 * the goon's own, toward her, so she faces it when hers is the opposite.
 */
const isFacedBy = (frame: BrawlFrame, facing: -1 | 1): boolean => frame.facing === -facing;

/** The honk: it stops dead, facing her, and the room has `telegraphTicks` to shout. */
const startTelegraph = (goon: BrawlGoon, facing: -1 | 1, y: number, tick: number): BrawlGoon => {
  return { ...goon, y, facing, vx: 0, state: "telegraph", stateUntilTick: tick + BRAWL_WORLD.goons[goon.kind].telegraphTicks };
};

const approachGoon = (goon: BrawlGoon, frame: BrawlFrame, tick: number): BrawlGoon => {
  const stats = BRAWL_WORLD.goons[goon.kind];
  const facing = signOf(frame.x - goon.x, goon.facing);
  const y = settleHeight(goon);

  if ((frame.x - goon.x) * facing <= stats.reach) {
    // A swan she is facing stands and waits at its reach; one she has her back to hisses.
    if (goon.kind === "swan" && isFacedBy(frame, facing)) {
      return { ...goon, y, facing, vx: 0, state: "stalk" };
    }

    return startTelegraph(goon, facing, y, tick);
  }

  const nextX = goon.x + facing * stats.speed;

  if (isQueued(goon, nextX, frame.x, frame.goons)) {
    return { ...goon, y, facing, vx: 0 };
  }

  return { ...goon, x: nextX, y, facing, vx: facing * stats.speed };
};

/**
 * The swan's stalk (SoR2's Signal): faced, it stands at its reach and does not advance or attack
 * — and it can be pecked. The tick she turns her back it hisses (`telegraph`), committed from
 * there, even if the turn stepped her out of its reach (the lunge covers it); faced but out of
 * its reach — she was knocked back, or walked off facing it — it goes back to closing on her.
 */
const stalkGoon = (goon: BrawlGoon, frame: BrawlFrame, tick: number): BrawlGoon => {
  const facing = signOf(frame.x - goon.x, goon.facing);

  // Her back first: the turn that takes her a step out of its reach is still a turn away.
  if (!isFacedBy(frame, facing)) {
    return startTelegraph(goon, facing, goon.y, tick);
  }

  if ((frame.x - goon.x) * facing > BRAWL_WORLD.goons[goon.kind].reach) {
    return { ...goon, facing, state: "approach" };
  }

  return goon.facing === facing && goon.vx === 0 ? goon : { ...goon, facing, vx: 0 };
};

/** The gull's dive starts going down at the speed that brings it back to its cruise on the last tick. */
const resolveDiveVy = (): number => {
  return (-BRAWL_WORLD.gullDiveGravity * (BRAWL_WORLD.goons.gull.attackTicks - 1)) / 2;
};

const attackGoon = (goon: BrawlGoon, tick: number): BrawlGoon => {
  const stats = BRAWL_WORLD.goons[goon.kind];
  const x = goon.x + goon.facing * stats.lunge;

  if (tick >= goon.stateUntilTick) {
    return {
      ...goon,
      x,
      y: goon.kind === "gull" ? BRAWL_WORLD.gullCruiseY : 0,
      vx: 0,
      vy: 0,
      state: "recover",
      stateUntilTick: tick + stats.recoverTicks
    };
  }

  if (goon.kind !== "gull") {
    return { ...goon, x, vx: goon.facing * stats.lunge };
  }

  return {
    ...goon,
    x,
    y: Math.max(0, goon.y + goon.vy),
    vx: goon.facing * stats.lunge,
    vy: goon.vy + BRAWL_WORLD.gullDiveGravity
  };
};

/** The timed states: telegraph into attack, recover and stunned back to approach, ko to gone. */
const stepTimedGoon = (goon: BrawlGoon, tick: number): BrawlGoon => {
  const stats = BRAWL_WORLD.goons[goon.kind];

  if (goon.state === "ko") {
    // A gull put down in the air drops to the street for its fall; everything else is already there.
    return tick >= goon.stateUntilTick
      ? { ...goon, state: "gone" }
      : { ...goon, y: Math.max(0, goon.y - BRAWL_WORLD.gullClimb * 2) };
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

/** One goon, one tick of its script. */
const stepGoon = (goon: BrawlGoon, frame: BrawlFrame, tick: number): BrawlGoon => {
  if (goon.state === "entering") {
    return enterGoon(goon, frame);
  }

  if (goon.state === "approach") {
    return clampGoon(approachGoon(goon, frame, tick), frame);
  }

  if (goon.state === "stalk") {
    return clampGoon(stalkGoon(goon, frame, tick), frame);
  }

  if (goon.state === "attack") {
    return clampGoon(attackGoon(goon, tick), frame);
  }

  return stepTimedGoon(goon, tick);
};

/** Whether a goon's box overlaps the strip `left`..`right`, from the ground up to the hen's height. */
const isGoonIn = (goon: BrawlGoon, left: number, right: number): boolean => {
  const { halfWidth } = BRAWL_WORLD.goons[goon.kind];

  return goon.x - halfWidth < right && goon.x + halfWidth > left && goon.y < BRAWL_WORLD.henHeight;
};

/** The peck is live from `peckDelayTicks` after the press until `peckUntilTick`. */
const isPeckLive = (frame: BrawlFrame, tick: number): boolean => {
  return tick < frame.peckUntilTick && tick >= frame.peckUntilTick - BRAWL_WORLD.peckActiveTicks;
};

/** One peck, one goon: a peck that has already connected is spent for the rest of its window. */
const hasPeckLanded = (frame: BrawlFrame): boolean => {
  const last = frame.landed[frame.landed.length - 1];

  return last !== undefined && last >= frame.peckUntilTick - BRAWL_WORLD.peckActiveTicks;
};

/**
 * The states a bowled goon can be knocked out of. A goon already reeling or down is not stunned
 * again — so a chain is one pass and never runs on — and one still walking in off the tablet's
 * frame is not on the street yet.
 */
const CHAINABLE_STATES: readonly BrawlGoonState[] = ["approach", "stalk", "telegraph", "attack", "recover"];

/**
 * The chain: a goon shoved from `fromX` to `toX` bowls through every other walker whose box
 * overlaps its path (the path widened by both half-widths), and each one is stunned for its own
 * `stunTicks` — no hp lost, no movement. Gulls are in the air and are never bowled. A stunned
 * goon does not chain further: one pass, no recursion, so the boss's escort is never free.
 */
const chainKnockback = (
  goons: readonly BrawlGoon[],
  shoved: BrawlGoon,
  fromX: number,
  tick: number
): { goons: BrawlGoon[]; bumped: number } => {
  const { halfWidth } = BRAWL_WORLD.goons[shoved.kind];
  const left = Math.min(fromX, shoved.x) - halfWidth;
  const right = Math.max(fromX, shoved.x) + halfWidth;
  let bumped = 0;
  const next = goons.map((goon): BrawlGoon => {
    if (goon === shoved || goon.kind === "gull" || !CHAINABLE_STATES.includes(goon.state)) {
      return goon;
    }

    const stats = BRAWL_WORLD.goons[goon.kind];

    if (goon.x + stats.halfWidth <= left || goon.x - stats.halfWidth >= right) {
      return goon;
    }

    bumped += 1;

    return { ...goon, vx: 0, vy: 0, state: "stunned", stateUntilTick: tick + stats.stunTicks };
  });

  return { goons: next, bumped };
};

/**
 * Whether a shove from `fromX` to `toX` touches the hazard's span — into it, across it, or out of
 * it. Only the goon the peck struck is shoved, so only it can be dunked.
 */
const isShovedThrough = (hazard: BrawlHazard, fromX: number, toX: number): boolean => {
  return Math.min(fromX, toX) <= hazard.x + hazard.width && Math.max(fromX, toX) >= hazard.x;
};

/** Gulls fly over the hazard and the boss is too heavy to go in: everything else can be dunked. */
const isDunkable = (goon: BrawlGoon): boolean => goon.kind !== "gull" && goon.kind !== "boss";

/**
 * A goon worth two or more that goes down drops a wing where it lands, inside the hen's reach of
 * the window — unless one is already on the street or this wave has already dropped one (a drop
 * at or after the tick the wave opened).
 */
const dropWing = (frame: BrawlFrame, goon: BrawlGoon, tick: number): BrawlFrame => {
  const isDroppedThisWave = frame.drops.some((drop) => drop >= frame.waveOpenedTick);

  if (BRAWL_WORLD.goons[goon.kind].worth < 2 || frame.pickups.length > 0 || isDroppedThisWave) {
    return frame;
  }

  const { width, henMargin, wingTicks } = BRAWL_WORLD;
  const x = Math.max(frame.cameraX + henMargin, Math.min(frame.cameraX + width - henMargin, goon.x));

  return { ...frame, pickups: [{ x, untilTick: tick + wingTicks }], drops: [...frame.drops, tick] };
};

/**
 * The beak: a box from her back edge to `peckReach` past her front, her height tall. The
 * nearest goon standing in it — stepped in, not still entering from off the tablet's frame —
 * takes the peck: a hp and a shove `knockback` away from her, then a reel, or the fall if that
 * was its last (a KO is sent flying the same distance and falls where it lands). A helmet goose
 * with its guard down (`isBrawlGoonGuarded`) takes the shove and nothing else: a CLANK, no hp, no
 * reel, the peck spent. A shove that carries the goon into or across the block's hazard DUNKS
 * it: down at once whatever its hp, its whole worth banked. Whatever it is bowled through on the
 * way is stunned too (`chainKnockback`): let them queue, then bowl. A goon worth two or more
 * that goes down drops a wing (`dropWing`).
 */
const resolvePeck = (frame: BrawlFrame, block: BrawlBlock, tick: number): BrawlFrame => {
  if (!isPeckLive(frame, tick) || hasPeckLanded(frame)) {
    return frame;
  }

  const reach = BRAWL_WORLD.henRadius + BRAWL_WORLD.peckReach;
  const left = frame.facing === 1 ? frame.x - BRAWL_WORLD.henRadius : frame.x - reach;
  const right = frame.facing === 1 ? frame.x + reach : frame.x + BRAWL_WORLD.henRadius;
  let target: BrawlGoon | null = null;

  for (const goon of frame.goons) {
    if (!isStanding(goon) || goon.state === "entering" || !isGoonIn(goon, left, right)) {
      continue;
    }

    if (target === null || Math.abs(goon.x - frame.x) < Math.abs(target.x - frame.x)) {
      target = goon;
    }
  }

  if (target === null) {
    return frame;
  }

  const stats = BRAWL_WORLD.goons[target.kind];
  const isClank = isBrawlGoonGuarded(target);
  const hp = isClank ? target.hp : target.hp - 1;
  const away = signOf(target.x - frame.x, frame.facing);
  const x = target.x + away * stats.knockback;
  const fall = (goon: BrawlGoon): BrawlGoon => ({
    ...goon,
    hp: 0,
    vx: 0,
    vy: 0,
    state: "ko",
    koTick: tick,
    stateUntilTick: tick + BRAWL_WORLD.koFallTicks
  });
  const struck: BrawlGoon = isClank
    ? { ...target, x, vx: 0, vy: 0 }
    : hp <= 0
      ? fall({ ...target, x })
      : { ...target, hp, x, vx: 0, vy: 0, state: "stunned", stateUntilTick: tick + stats.stunTicks };
  // The locked window still pins it, so the path it bowls along ends where it actually lands.
  const pinned = clampGoon(struck, frame);
  const isDunk = block.hazard !== null && isDunkable(target) && isShovedThrough(block.hazard, target.x, pinned.x);
  const shoved = isDunk && pinned.state !== "ko" ? fall(pinned) : pinned;
  const isDown = shoved.state === "ko";
  const chained = chainKnockback(
    frame.goons.map((goon) => (goon === target ? shoved : goon)),
    shoved,
    target.x,
    tick
  );
  const mark = { tick, spawnIndex: target.spawnIndex };
  const pecked: BrawlFrame = {
    ...frame,
    goons: chained.goons,
    landed: [...frame.landed, tick],
    goonsDown: isDown ? frame.goonsDown + stats.worth : frame.goonsDown,
    kos: isDown ? [...frame.kos, tick] : frame.kos,
    bumps: chained.bumped === 0 ? frame.bumps : [...frame.bumps, ...Array.from({ length: chained.bumped }, () => tick)],
    clanks: isClank ? [...frame.clanks, mark] : frame.clanks,
    dunks: isDunk ? [...frame.dunks, mark] : frame.dunks
  };

  return isDown ? dropWing(pecked, shoved, tick) : pecked;
};

/**
 * A goon mid-attack whose own box overlaps hers costs a heart, shoves her away from it and
 * reels her, then she is invulnerable for a while: one lunge, one heart.
 */
const resolveHits = (frame: BrawlFrame, tick: number): BrawlFrame => {
  if (tick < frame.invulnerableUntilTick) {
    return frame;
  }

  const left = frame.x - BRAWL_WORLD.henRadius;
  const right = frame.x + BRAWL_WORLD.henRadius;
  const attacker = frame.goons.find((goon) => goon.state === "attack" && isGoonIn(goon, left, right));

  if (attacker === undefined) {
    return frame;
  }

  const away = signOf(frame.x - attacker.x, attacker.facing);

  return clampHen({
    ...frame,
    x: frame.x + away * BRAWL_WORLD.hitKnockback,
    hearts: frame.hearts - 1,
    hurtUntilTick: tick + BRAWL_WORLD.hurtTicks,
    invulnerableUntilTick: tick + BRAWL_WORLD.invulnerableTicks,
    // A hit knocks the beak shut: a peck in flight does not land from the floor.
    peckUntilTick: Math.min(frame.peckUntilTick, tick),
    hits: [...frame.hits, tick]
  });
};

/**
 * The wing on the street: gone at its `untilTick`, and eaten when she STANDS within
 * `henRadius + wingReach` of it — thumb up, not walking — with a heart to fill: one heart back,
 * up to the cap (`resolveBrawlHeartsCap`). Standing still is the price (Mother Russia Bleeds'
 * harvest, research M.4.4): the wing lies where the goons fall, so stopping on it is stopping in
 * the fight. A hen walking over it, or at full hearts, leaves it where it is; on her last
 * heart's fall (nought hearts) it is too late. The stop is also what keeps the wing from being a
 * masher's free heal: a hen pinned to the window's edge with the thumb held never eats one.
 */
const resolvePickups = (frame: BrawlFrame, block: BrawlBlock, tick: number): BrawlFrame => {
  if (frame.pickups.length === 0) {
    return frame;
  }

  const live = frame.pickups.filter((pickup) => pickup.untilTick > tick);
  const canEat = frame.walking === 0 && frame.hearts > 0 && frame.hearts < resolveBrawlHeartsCap(block);
  const reach = BRAWL_WORLD.henRadius + BRAWL_WORLD.wingReach;
  const eaten = canEat ? live.find((pickup) => Math.abs(pickup.x - frame.x) <= reach) : undefined;

  if (eaten === undefined) {
    return live.length === frame.pickups.length ? frame : { ...frame, pickups: live };
  }

  return {
    ...frame,
    hearts: frame.hearts + 1,
    pickups: live.filter((pickup) => pickup !== eaten),
    wings: [...frame.wings, tick]
  };
};

/**
 * Whether the wave in hand is clean so far: no hit on her since the camera locked on it. Read by
 * the sim as the wave goes down, and by the TV's wave meter every frame, so the star it lights is
 * the one the sim banks. Once the camera lets go `waveOpenedTick` is still the wave just fought,
 * so this then says whether that wave banked its bonus.
 */
export const isBrawlWaveClean = (frame: BrawlFrame): boolean => {
  return !frame.hits.some((hit) => hit >= frame.waveOpenedTick);
};

/**
 * The wave is down when every one of its spawns has stepped in and none is still standing. The
 * camera lets go and the next wave waits at its own lock. A wave she took down without being hit
 * banks `cleanWaveBonus` on the spot (feature 1): the thing to lose in every wave.
 */
const resolveWaveDown = (frame: BrawlFrame, block: BrawlBlock): BrawlFrame => {
  const wave = block.waves[frame.waveIndex];

  if (wave === undefined || !frame.cameraLocked) {
    return frame;
  }

  const waveEnd = (wave.spawns[wave.spawns.length - 1]?.index ?? -1) + 1;

  if (frame.spawned < waveEnd || frame.goons.some(isStanding)) {
    return frame;
  }

  const isClean = isBrawlWaveClean(frame);

  return {
    ...frame,
    cameraLocked: false,
    waveIndex: frame.waveIndex + 1,
    goonsDown: isClean ? frame.goonsDown + BRAWL_WORLD.cleanWaveBonus : frame.goonsDown,
    bonuses: isClean ? [...frame.bonuses, frame.tick] : frame.bonuses
  };
};

const resolveOutcome = (frame: BrawlFrame, block: BrawlBlock): BrawlFrame => {
  if (frame.hearts <= 0) {
    return { ...frame, hearts: 0, outcome: "ko" };
  }

  if (frame.waveIndex >= block.waves.length && frame.x >= block.handoffX) {
    return { ...frame, outcome: "cleared" };
  }

  if (frame.tick >= resolveBrawlTickCap()) {
    return { ...frame, outcome: "timeout" };
  }

  return frame;
};

/**
 * The whole fight, one tick. A terminal frame steps to itself, so callers can advance past the
 * outcome without guarding. The inputs logged at this frame's tick apply first; then she
 * walks, the camera follows or holds, the wave's goons step in and run their scripts, the peck
 * lands (or clanks, or dunks, and maybe drops a wing), the goons' attacks land, she eats a wing
 * she is standing on, the fallen are tidied away, and the wave and the block are checked for
 * their ends.
 */
export const stepBrawl = (frame: BrawlFrame, block: BrawlBlock, inputs: readonly BrawlInput[]): BrawlFrame => {
  if (frame.outcome !== null) {
    return frame;
  }

  const tick = frame.tick + 1;
  const thumbed = applyInputs(frame, inputs);
  const walked = moveCamera(moveHen({ ...thumbed, tick }, tick), block, tick);
  const placed = spawnGoons(clampHen(walked), block, tick);
  const scripted: BrawlFrame = {
    ...placed,
    goons: placed.goons.map((goon) => stepGoon(goon, placed, tick))
  };
  const fought = resolvePickups(resolveHits(resolvePeck(scripted, block, tick), tick), block, tick);
  const tidied = fought.goons.some((goon) => goon.state === "gone")
    ? { ...fought, goons: fought.goons.filter((goon) => goon.state !== "gone") }
    : fought;

  return resolveOutcome(resolveWaveDown(tidied, block), block);
};

/**
 * Steps `frame` up to `toTick`, or to a terminal frame, replaying the thumbs from `inputs` as it
 * goes. An input logged at tick T applies to the step that produces T + 1 — the same rule the
 * tablet used when it logged the touch at its current tick. Inputs earlier than the frame are
 * already baked into it (the thumb's state is in the frame), so they are skipped, never applied
 * late.
 */
export const advanceBrawl = (
  frame: BrawlFrame,
  block: BrawlBlock,
  inputs: readonly BrawlInput[],
  toTick: number
): BrawlFrame => {
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

    current = stepBrawl(current, block, from === cursor ? [] : inputs.slice(from, cursor));
  }

  return current;
};

/**
 * Runs one block's log from the top to its outcome. This is the referee: the server scores from
 * nothing else. The tick cap guarantees an outcome, so it never comes back `running`.
 */
export const runBrawlRun = (course: BrawlCourse, inputs: readonly BrawlInput[]): BrawlRun => {
  const block = resolveBrawlBlock(course);
  const frame = advanceBrawl(createBrawlRunStart(block), block, inputs, resolveBrawlTickCap());

  return {
    outcome: frame.outcome ?? "running",
    endTick: frame.tick,
    goons: frame.goonsDown,
    frame
  };
};
