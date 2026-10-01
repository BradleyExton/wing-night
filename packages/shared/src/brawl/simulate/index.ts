import type { BrawlBlock, BrawlCourse, BrawlFrame, BrawlGoon, BrawlInput, BrawlRun, BrawlSpawn } from "../types.js";
import { BRAWL_WORLD, resolveBrawlBlock, resolveBrawlTickCap } from "../world/index.js";

/** The frame a block starts from: the hen on the line, three hearts, the camera locked on wave 0. */
export const createBrawlRunStart = (block: BrawlBlock): BrawlFrame => {
  return {
    tick: 0,
    x: BRAWL_WORLD.henStartX,
    facing: 1,
    walking: 0,
    hearts: BRAWL_WORLD.heartsMax,
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

  return {
    spawnIndex: spawn.index,
    kind: spawn.kind,
    // Just past the edge it comes in from, so it walks into the frame rather than appearing in it.
    x: spawn.side === -1 ? cameraX - halfWidth : cameraX + BRAWL_WORLD.width + halfWidth,
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

const approachGoon = (goon: BrawlGoon, frame: BrawlFrame, tick: number): BrawlGoon => {
  const stats = BRAWL_WORLD.goons[goon.kind];
  const facing = signOf(frame.x - goon.x, goon.facing);
  const y = settleHeight(goon);

  if ((frame.x - goon.x) * facing <= stats.reach) {
    // The honk: it stops dead, facing her, and the room has `telegraphTicks` to shout.
    return { ...goon, y, facing, vx: 0, state: "telegraph", stateUntilTick: tick + stats.telegraphTicks };
  }

  const nextX = goon.x + facing * stats.speed;

  if (isQueued(goon, nextX, frame.x, frame.goons)) {
    return { ...goon, y, facing, vx: 0 };
  }

  return { ...goon, x: nextX, y, facing, vx: facing * stats.speed };
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
 * The beak: a box from her back edge to `peckReach` past her front, her height tall. The
 * nearest goon standing in it — stepped in, not still entering from off the tablet's frame —
 * takes the peck: a hp, a shove away from her and a reel, or down if that was its last.
 */
const resolvePeck = (frame: BrawlFrame, tick: number): BrawlFrame => {
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
  const hp = target.hp - 1;
  const away = signOf(target.x - frame.x, frame.facing);
  const struck: BrawlGoon =
    hp <= 0
      ? { ...target, hp: 0, vx: 0, vy: 0, state: "ko", koTick: tick, stateUntilTick: tick + BRAWL_WORLD.koFallTicks }
      : {
          ...target,
          hp,
          x: target.x + away * stats.knockback,
          vx: 0,
          vy: 0,
          state: "stunned",
          stateUntilTick: tick + stats.stunTicks
        };

  return {
    ...frame,
    goons: frame.goons.map((goon) => (goon === target ? clampGoon(struck, frame) : goon)),
    landed: [...frame.landed, tick],
    goonsDown: hp <= 0 ? frame.goonsDown + stats.worth : frame.goonsDown,
    kos: hp <= 0 ? [...frame.kos, tick] : frame.kos
  };
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
 * The wave is down when every one of its spawns has stepped in and none is still standing. The
 * camera lets go and the next wave waits at its own lock.
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

  return { ...frame, cameraLocked: false, waveIndex: frame.waveIndex + 1 };
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
 * lands, the goons' attacks land, the fallen are tidied away, and the wave and the block are
 * checked for their ends.
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
  const fought = resolveHits(resolvePeck(scripted, tick), tick);
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
