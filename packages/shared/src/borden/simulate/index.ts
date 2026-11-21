import type {
  BordenBottle,
  BordenEvent,
  BordenFoe,
  BordenFrame,
  BordenHen,
  BordenInput,
  BordenSauce,
  BordenShot,
  BordenSpawn,
  BordenStretch
} from "../types.js";
import {
  BORDEN_STICKS,
  BORDEN_WORLD,
  resolveBordenFoeBox,
  resolveBordenFoeHp,
  resolveBordenWakeX
} from "../world/index.js";

const WORLD = BORDEN_WORLD;

/** Where each hen of the pair stands when a stretch starts: the first in front. */
const HEN_START_X = [24, 12] as const;

const createHen = (slot: number, bottle: BordenBottle): BordenHen => ({
  slot,
  x: HEN_START_X[slot] ?? WORLD.henMargin,
  y: 0,
  vy: 0,
  facing: 1,
  stick: 0,
  jumpWantedUntilTick: -1,
  bottle,
  hearts: WORLD.heartsMax,
  state: "up",
  nextSauceTick: 0,
  hurtUntilTick: 0,
  invulnerableUntilTick: 0,
  reviveSinceTick: null,
  lastInputTick: 0,
  stats: { downed: 0, worth: 0, dodged: 0, hits: 0, downs: 0, revives: 0 }
});

/**
 * The frame a stretch starts from: the pair at the left edge with three hearts each. `bottles` are
 * what they carry in, slot by slot (`resolveBordenHandoffBottles`); a hen not handed one is on mild.
 */
export const createBordenStart = (
  stretch: BordenStretch,
  options: { bottles?: readonly BordenBottle[] } = {}
): BordenFrame => ({
  tick: 0,
  hens: Array.from({ length: stretch.pair }, (_, slot) => createHen(slot, options.bottles?.[slot] ?? "mild")),
  foes: [],
  woken: 0,
  shots: [],
  sauce: [],
  puddles: [],
  bottle: { ...stretch.bottle },
  cameraX: 0,
  telegraph: null,
  nextTelegraphTick: WORLD.firstTelegraphTick,
  volley: 0,
  nextId: 1,
  banked: 0,
  events: [],
  outcome: null
});

export const isBordenHenAirborne = (hen: Pick<BordenHen, "y" | "vy">): boolean => hen.y > 0 || hen.vy > 0;

/** On the ground with the stick down (straight or either diagonal): low, planted, spraying along the floor. */
export const isBordenHenDucking = (hen: Pick<BordenHen, "state" | "y" | "vy" | "stick">): boolean => {
  return hen.state === "up" && !isBordenHenAirborne(hen) && BORDEN_STICKS[hen.stick].y === -1;
};

export const resolveBordenHenHeight = (hen: Pick<BordenHen, "state" | "y" | "vy" | "stick">): number => {
  return isBordenHenDucking(hen) ? WORLD.duckHeight : WORLD.henHeight;
};

/** A foe still in the fight: woken, and not yet sprayed down. */
export const isBordenFoeLive = (foe: Pick<BordenFoe, "koTick">): boolean => foe.koTick === null;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * A copy of the frame deep enough to write into: the step builds the next frame by editing this,
 * so the frame it was handed — which a screen may still be drawing — is never touched.
 */
const draftFrame = (frame: BordenFrame): BordenFrame => ({
  ...frame,
  hens: frame.hens.map((hen) => ({ ...hen, stats: { ...hen.stats } })),
  foes: frame.foes.map((foe) => ({ ...foe, touched: [...foe.touched] })),
  shots: frame.shots.map((shot) => ({ ...shot, settled: [...shot.settled] })),
  sauce: frame.sauce.map((drop) => ({ ...drop })),
  puddles: frame.puddles.map((puddle) => ({ ...puddle })),
  bottle: frame.bottle === null ? null : { ...frame.bottle },
  telegraph: frame.telegraph === null ? null : { ...frame.telegraph },
  events: [...frame.events]
});

const pushEvent = (draft: BordenFrame, event: Omit<BordenEvent, "tick">): void => {
  draft.events.push({ tick: draft.tick, ...event });
};

/**
 * The thumbs, for the inputs stamped at exactly this frame's tick, in the order they came. A stick
 * moves the stick; a jump asks for a jump for the next `jumpBufferTicks`. Any input stands up a hen
 * who was away. A slot nobody is in, or a stick that is not one of the nine, is ignored.
 */
const applyInputs = (draft: BordenFrame, inputs: readonly BordenInput[]): void => {
  for (const input of inputs) {
    const hen = draft.hens[input.hen];

    if (input.tick !== draft.tick || hen === undefined) {
      continue;
    }

    if (input.kind === "stick" && BORDEN_STICKS[input.dir] === undefined) {
      continue;
    }

    hen.lastInputTick = draft.tick;

    if (hen.state === "away") {
      hen.state = "up";
    }

    if (input.kind === "stick") {
      hen.stick = input.dir;
    } else {
      hen.jumpWantedUntilTick = draft.tick + WORLD.jumpBufferTicks;
    }
  }
};

const fall = (hen: BordenHen): void => {
  if (hen.y <= 0 && hen.vy === 0) {
    return;
  }

  hen.y += hen.vy;
  hen.vy -= WORLD.gravity;

  if (hen.y <= 0) {
    hen.y = 0;
    hen.vy = 0;
  }
};

/**
 * Her aim as a vector of the bottle's speed: the stick's direction, or the way she faces with the
 * stick at rest. Ducked, she sprays along the floor whichever way the stick leans.
 */
const resolveAim = (hen: BordenHen): { x: number; y: number } => {
  const step = BORDEN_STICKS[hen.stick];

  if (isBordenHenDucking(hen) || (step.x === 0 && step.y === 0)) {
    return { x: hen.facing, y: 0 };
  }

  if (step.x !== 0 && step.y !== 0) {
    return { x: step.x * WORLD.diagonal, y: step.y * WORLD.diagonal };
  }

  return { x: step.x, y: step.y };
};

/** She never stops spraying: one stream, or the spread's three, each `everyTicks`. */
const spray = (draft: BordenFrame, hen: BordenHen): void => {
  const bottle = WORLD.bottles[hen.bottle];
  const aim = resolveAim(hen);
  const ducking = isBordenHenDucking(hen);
  const x = hen.x + hen.facing * WORLD.henHalfWidth;
  const y = hen.y + (ducking ? WORLD.duckBeakHeight : WORLD.beakHeight);
  const streams =
    bottle.streams === 1
      ? [aim]
      : [-1, 0, 1].map((side) => {
          // Turned either side by a fixed share of the aim's perpendicular, and scaled back to its length.
          const scale = side === 0 ? 1 : WORLD.spreadScale;

          return {
            x: (aim.x - side * WORLD.spreadSide * aim.y) * scale,
            y: (aim.y + side * WORLD.spreadSide * aim.x) * scale
          };
        });

  hen.nextSauceTick = draft.tick + bottle.everyTicks;

  for (const stream of streams) {
    const drop: BordenSauce = {
      id: draft.nextId,
      hen: hen.slot,
      x,
      y,
      vx: stream.x * bottle.speed,
      vy: stream.y * bottle.speed,
      falls: bottle.falls,
      untilTick: draft.tick + bottle.lifeTicks
    };

    draft.nextId += 1;
    draft.sauce.push(drop);
  }
};

/**
 * One hen, one tick: away if she has left the pad alone too long; otherwise turn, jump (a buffered
 * press jumps her the tick she is on the ground), run unless ducked, fall, and spray.
 */
const stepHen = (draft: BordenFrame, hen: BordenHen): void => {
  const { tick } = draft;

  if (hen.state === "down") {
    fall(hen);

    return;
  }

  if (hen.state === "away") {
    return;
  }

  if (hen.stick === 0 && tick - hen.lastInputTick >= WORLD.awayTicks && tick > hen.jumpWantedUntilTick) {
    hen.state = "away";

    return;
  }

  const step = BORDEN_STICKS[hen.stick];

  if (step.x !== 0) {
    hen.facing = step.x;
  }

  if (!isBordenHenAirborne(hen) && tick <= hen.jumpWantedUntilTick) {
    hen.vy = WORLD.jumpSpeed;
    hen.jumpWantedUntilTick = -1;
    pushEvent(draft, { kind: "jump", hen: hen.slot });
  }

  // A duck plants her; she steers freely in the air.
  if (step.x !== 0 && !isBordenHenDucking(hen)) {
    hen.x += step.x * WORLD.walkSpeed;
  }

  fall(hen);

  if (tick >= hen.nextSauceTick) {
    spray(draft, hen);
  }
};

/** The live sergeant, if one is holding the gate. */
const resolveGuard = (draft: BordenFrame): BordenFoe | undefined => {
  return draft.foes.find((foe) => foe.kind === "sergeant" && isBordenFoeLive(foe));
};

/**
 * The camera keeps the lead hen still up `cameraLeadShare` in from its left edge, rightward only,
 * and stops at the stretch's last screen.
 */
const moveCamera = (draft: BordenFrame, stretch: BordenStretch): void => {
  let lead: number | null = null;

  for (const hen of draft.hens) {
    if (hen.state === "up" && (lead === null || hen.x > lead)) {
      lead = hen.x;
    }
  }

  if (lead === null) {
    return;
  }

  const target = Math.min(stretch.length - WORLD.width, lead - WORLD.width * WORLD.cameraLeadShare);

  draft.cameraX = Math.max(draft.cameraX, target);
};

const createFoe = (draft: BordenFrame, spawn: BordenSpawn, pair: number): BordenFoe => {
  const { halfWidth, speed } = WORLD.foes[spawn.kind];
  const isRolling = spawn.kind === "goose" || spawn.kind === "tank";
  const enterX = draft.cameraX + WORLD.width + WORLD.enterLead + halfWidth;

  return {
    id: spawn.id,
    kind: spawn.kind,
    x: isRolling ? Math.max(spawn.x, enterX) : spawn.x,
    homeX: spawn.x,
    vx: isRolling ? -speed : 0,
    hp: resolveBordenFoeHp(spawn.kind, pair),
    level: spawn.level,
    parked: spawn.kind !== "tank",
    koTick: null,
    koBy: null,
    touched: []
  };
};

/** Every spawn whose wake point the window's right edge has reached joins the fight, in order. */
const wakeSpawns = (draft: BordenFrame, stretch: BordenStretch): void => {
  const right = draft.cameraX + WORLD.width;

  for (let spawn = stretch.spawns[draft.woken]; spawn !== undefined; spawn = stretch.spawns[draft.woken]) {
    if (resolveBordenWakeX(spawn) > right) {
      return;
    }

    draft.foes.push(createFoe(draft, spawn, stretch.pair));
    draft.woken += 1;
  }
};

/**
 * Nobody leaves the window: a hen at its left edge is walked along by the camera, a downed or
 * sitting one is slid along it, and while the sergeant stands nobody gets past him to the gate.
 */
const clampHens = (draft: BordenFrame): void => {
  const guard = resolveGuard(draft);
  const min = draft.cameraX + WORLD.henMargin;
  const windowMax = draft.cameraX + WORLD.width - WORLD.henMargin;
  const max =
    guard === undefined ? windowMax : Math.min(windowMax, guard.x - WORLD.foes.sergeant.halfWidth - WORLD.henHalfWidth - 1);

  for (const hen of draft.hens) {
    hen.x = clamp(hen.x, min, max);
  }
};

/** A goose runs through and off the left of the window; a tank rolls in and parks. */
const stepFoes = (draft: BordenFrame): void => {
  const offLeft = draft.cameraX - WORLD.foes.tank.halfWidth * 2;

  draft.foes = draft.foes.filter((foe) => {
    if (!isBordenFoeLive(foe)) {
      return draft.tick - (foe.koTick ?? draft.tick) < WORLD.koLingerTicks;
    }

    if (foe.kind === "goose") {
      foe.x += foe.vx;

      return foe.x > offLeft;
    }

    if (foe.kind === "tank" && !foe.parked) {
      foe.x = Math.max(foe.homeX, foe.x + foe.vx);

      if (foe.x <= foe.homeX) {
        foe.parked = true;
        foe.vx = 0;
      }
    }

    return true;
  });
};

/** A foe that can take a turn shooting: a turret, a parked tank or the sergeant, live and in the window. */
const isShooting = (draft: BordenFrame, foe: BordenFoe): boolean => {
  return (
    isBordenFoeLive(foe) &&
    foe.parked &&
    foe.kind !== "goose" &&
    foe.x >= draft.cameraX &&
    foe.x <= draft.cameraX + WORLD.width
  );
};

const resolveNearestUp = (draft: BordenFrame, x: number): BordenHen | null => {
  let nearest: BordenHen | null = null;

  for (const hen of draft.hens) {
    if (hen.state === "up" && (nearest === null || Math.abs(hen.x - x) < Math.abs(nearest.x - x))) {
      nearest = hen;
    }
  }

  return nearest;
};

/**
 * The shot leaves the foe level, toward the nearest hen still up: a turret at its own height, a
 * tank a slow low shell, the sergeant low and high in turn. A hen behind it is already past it.
 */
const fire = (draft: BordenFrame, foe: BordenFoe): void => {
  const target = resolveNearestUp(draft, foe.x);
  const dir: -1 | 1 = target !== null && target.x > foe.x ? 1 : -1;
  const isShell = foe.kind === "tank";
  const level = isShell ? "low" : foe.level;
  const radius = isShell ? WORLD.shellRadius : WORLD.shotRadius;
  const speed =
    WORLD.shotSpeed * (isShell ? WORLD.shellSpeedShare : 1) * (draft.volley === 0 ? WORLD.firstShotSpeedShare : 1);
  const x = foe.x + dir * (WORLD.foes[foe.kind].halfWidth + radius);
  const shot: BordenShot = {
    id: draft.nextId,
    x,
    y: level === "low" ? WORLD.lowShotHeight : WORLD.highShotHeight,
    vx: dir * speed,
    radius,
    settled: draft.hens.filter((hen) => (dir === 1 ? hen.x < x : hen.x > x)).map((hen) => hen.slot)
  };

  if (foe.kind === "sergeant") {
    foe.level = foe.level === "low" ? "high" : "low";
  }

  draft.nextId += 1;
  draft.volley += 1;
  draft.shots.push(shot);
  pushEvent(draft, { kind: "fire", foeId: foe.id });
};

/**
 * One shooter at a time, so there is one answer at a time: it flashes for `telegraphTicks`, fires,
 * and the next one in the window (round-robin by the volley) starts after the stretch's rest. A
 * shooter sprayed down or left behind mid-flash never fires.
 */
const runFireControl = (draft: BordenFrame, stretch: BordenStretch): void => {
  const { tick } = draft;

  if (draft.telegraph !== null) {
    const foeId = draft.telegraph.foeId;
    const foe = draft.foes.find((candidate) => candidate.id === foeId);

    if (foe === undefined || !isShooting(draft, foe)) {
      draft.telegraph = null;
      draft.nextTelegraphTick = tick + WORLD.cancelRestTicks;
    } else if (tick >= draft.telegraph.fireTick) {
      fire(draft, foe);
      draft.telegraph = null;
      draft.nextTelegraphTick = tick + stretch.restTicks;
    }
  }

  if (draft.telegraph !== null || tick < draft.nextTelegraphTick || resolveNearestUp(draft, 0) === null) {
    return;
  }

  const shooters = draft.foes.filter((foe) => isShooting(draft, foe));
  const next = shooters[draft.volley % Math.max(1, shooters.length)];

  if (next !== undefined) {
    draft.telegraph = { foeId: next.id, fireTick: tick + WORLD.telegraphTicks };
  }
};

/** A hit takes the hot bottle first, then a heart; out of hearts she goes down where she stands. */
const hurtHen = (draft: BordenFrame, hen: BordenHen): void => {
  hen.stats.hits += 1;
  hen.hurtUntilTick = draft.tick + WORLD.hurtTicks;
  hen.invulnerableUntilTick = draft.tick + WORLD.invulnerableTicks;
  pushEvent(draft, { kind: "hit", hen: hen.slot });

  if (hen.bottle !== "mild") {
    hen.bottle = "mild";
    pushEvent(draft, { kind: "bottle-lost", hen: hen.slot });

    return;
  }

  hen.hearts -= 1;

  if (hen.hearts <= 0) {
    hen.hearts = 0;
    hen.state = "down";
    hen.reviveSinceTick = null;
    hen.stats.downs += 1;
    pushEvent(draft, { kind: "down", hen: hen.slot });
  }
};

const isHurtable = (draft: BordenFrame, hen: BordenHen): boolean => {
  return hen.state === "up" && draft.tick >= hen.invulnerableUntilTick;
};

/** Whether a box `half` either side of `x`, from `bottom` to `top`, meets her box shaved by the forgiveness. */
const meetsHen = (hen: BordenHen, x: number, half: number, bottom: number, top: number): boolean => {
  const reach = Math.max(0.5, WORLD.henHalfWidth - WORLD.forgiveness);
  const henBottom = hen.y + WORLD.forgiveness;
  const henTop = hen.y + resolveBordenHenHeight(hen) - WORLD.forgiveness;

  return Math.abs(x - hen.x) < reach + half && top > henBottom && bottom < henTop;
};

/**
 * Every shot flies level. It hurts the first hen it meets, once; a hen it goes past while she could
 * have been hit has dodged it. It leaves the frame a little past the window.
 */
const stepShots = (draft: BordenFrame): void => {
  const left = draft.cameraX - 10;
  const right = draft.cameraX + WORLD.width + 10;

  draft.shots = draft.shots.filter((shot) => {
    shot.x += shot.vx;

    for (const hen of draft.hens) {
      if (shot.settled.includes(hen.slot)) {
        continue;
      }

      const isPast =
        shot.vx > 0 ? shot.x - shot.radius > hen.x + WORLD.henHalfWidth : shot.x + shot.radius < hen.x - WORLD.henHalfWidth;

      if (isPast) {
        shot.settled.push(hen.slot);

        if (isHurtable(draft, hen)) {
          hen.stats.dodged += 1;
        }

        continue;
      }

      if (isHurtable(draft, hen) && meetsHen(hen, shot.x, shot.radius, shot.y - shot.radius, shot.y + shot.radius)) {
        shot.settled.push(hen.slot);
        hurtHen(draft, hen);

        return false;
      }
    }

    return shot.x > left && shot.x < right;
  });
};

/** A goose's body hurts each hen once as it runs through her; a tank's every time she is hurtable. */
const resolveBodies = (draft: BordenFrame): void => {
  for (const foe of draft.foes) {
    if (!isBordenFoeLive(foe) || (foe.kind !== "goose" && foe.kind !== "tank")) {
      continue;
    }

    const box = resolveBordenFoeBox(foe);

    for (const hen of draft.hens) {
      if (foe.touched.includes(hen.slot) || !isHurtable(draft, hen)) {
        continue;
      }

      if (meetsHen(hen, foe.x, WORLD.foes[foe.kind].halfWidth, box.bottom, box.top)) {
        if (foe.kind === "goose") {
          foe.touched.push(hen.slot);
        }

        hurtHen(draft, hen);
      }
    }
  }
};

/** One off a foe; at nought it is down, banked, and credited to the hen whose sauce it was. */
const damageFoe = (draft: BordenFrame, foe: BordenFoe, slot: number): void => {
  foe.hp -= 1;

  if (foe.hp > 0) {
    return;
  }

  const { worth } = WORLD.foes[foe.kind];
  const hen = draft.hens[slot];

  foe.hp = 0;
  foe.koTick = draft.tick;
  foe.koBy = slot;
  draft.banked += worth;

  if (hen !== undefined) {
    hen.stats.downed += 1;
    hen.stats.worth += worth;
  }

  pushEvent(draft, { kind: "ko", foeId: foe.id, hen: slot });
};

const resolveSauceTarget = (draft: BordenFrame, drop: BordenSauce): BordenFoe | undefined => {
  return draft.foes.find((foe) => {
    if (!isBordenFoeLive(foe)) {
      return false;
    }

    const box = resolveBordenFoeBox(foe);

    return (
      Math.abs(drop.x - foe.x) < WORLD.foes[foe.kind].halfWidth + WORLD.sauceRadius &&
      drop.y + WORLD.sauceRadius > box.bottom &&
      drop.y - WORLD.sauceRadius < box.top
    );
  });
};

/**
 * The sauce flies, puddle sauce falling as it goes. A drop that meets a foe takes one off it; puddle
 * sauce that meets the ground splashes there; the rest dies on the ground, at the end of its reach
 * or out of the window.
 */
const stepSauce = (draft: BordenFrame): void => {
  const left = draft.cameraX - 4;
  const right = draft.cameraX + WORLD.width + 4;

  draft.sauce = draft.sauce.filter((drop) => {
    drop.x += drop.vx;
    drop.y += drop.vy;

    if (drop.falls) {
      drop.vy -= WORLD.sauceGravity;
    }

    const foe = resolveSauceTarget(draft, drop);

    if (foe !== undefined) {
      damageFoe(draft, foe, drop.hen);

      return false;
    }

    if (drop.y <= 0) {
      if (drop.falls) {
        draft.puddles.push({ id: draft.nextId, hen: drop.hen, x: drop.x, untilTick: draft.tick + WORLD.puddleTicks });
        draft.nextId += 1;
        pushEvent(draft, { kind: "splash", hen: drop.hen });
      }

      return false;
    }

    return draft.tick < drop.untilTick && drop.x > left && drop.x < right && drop.y < WORLD.height;
  });
};

/** A puddle takes one off everything standing in it, every `burnEveryTicks`, until it dries. */
const burnPuddles = (draft: BordenFrame): void => {
  draft.puddles = draft.puddles.filter((puddle) => draft.tick < puddle.untilTick);

  if (draft.puddles.length === 0 || draft.tick % WORLD.burnEveryTicks !== 0) {
    return;
  }

  for (const puddle of draft.puddles) {
    for (const foe of draft.foes) {
      const isStanding = resolveBordenFoeBox(foe).bottom <= 1;

      if (
        isBordenFoeLive(foe) &&
        isStanding &&
        Math.abs(foe.x - puddle.x) < WORLD.foes[foe.kind].halfWidth + WORLD.puddleHalfWidth
      ) {
        damageFoe(draft, foe, puddle.hen);
      }
    }
  }
};

/** The first hen up to run over the hot bottle takes it, whatever she was carrying. */
const pickUpBottle = (draft: BordenFrame): void => {
  const drop = draft.bottle;

  if (drop === null) {
    return;
  }

  const taker = draft.hens.find((hen) => hen.state === "up" && Math.abs(hen.x - drop.x) <= WORLD.bottleReach);

  if (taker === undefined) {
    return;
  }

  taker.bottle = drop.bottle;
  draft.bottle = null;
  pushEvent(draft, { kind: "bottle", hen: taker.slot });
};

const canRevive = (draft: BordenFrame, reviver: BordenHen, fallen: BordenHen): boolean => {
  return (
    reviver.state === "up" &&
    reviver.stick === 0 &&
    !isBordenHenAirborne(reviver) &&
    draft.tick >= reviver.hurtUntilTick &&
    Math.abs(reviver.x - fallen.x) <= WORLD.reviveReach
  );
};

/**
 * A downed hen gets up, on one heart and invulnerable for the window, once her partner has stood
 * over her, stick at rest, for `reviveTicks` without a break. A hit on the partner starts it over.
 */
const resolveRevives = (draft: BordenFrame): void => {
  for (const hen of draft.hens) {
    if (hen.state !== "down") {
      continue;
    }

    const reviver = draft.hens.find((other) => other.slot !== hen.slot && canRevive(draft, other, hen));

    if (reviver === undefined) {
      hen.reviveSinceTick = null;
      continue;
    }

    const since = hen.reviveSinceTick ?? draft.tick;

    if (draft.tick - since < WORLD.reviveTicks) {
      hen.reviveSinceTick = since;
      continue;
    }

    hen.state = "up";
    hen.hearts = WORLD.reviveHearts;
    hen.hurtUntilTick = draft.tick;
    hen.invulnerableUntilTick = draft.tick + WORLD.invulnerableTicks;
    hen.reviveSinceTick = null;
    hen.lastInputTick = draft.tick;
    hen.nextSauceTick = draft.tick;
    reviver.stats.revives += 1;
    pushEvent(draft, { kind: "revive", hen: hen.slot });
  }
};

const tidyEvents = (draft: BordenFrame): void => {
  const oldest = draft.tick - WORLD.eventWindowTicks;

  if (draft.events.some((event) => event.tick < oldest)) {
    draft.events = draft.events.filter((event) => event.tick >= oldest);
  }
};

/** What the hens still up at the gate carry through it: a heart's worth for each heart. */
export const resolveBordenHeartsCarried = (hens: readonly Pick<BordenHen, "state" | "hearts">[]): number => {
  return hens.reduce((total, hen) => (hen.state === "up" ? total + hen.hearts * WORLD.heartWorth : total), 0);
};

const resolveOutcome = (draft: BordenFrame, stretch: BordenStretch): void => {
  // Both down at once ends the stretch. A pair that is all sat out is nobody playing, not a wipe.
  if (!draft.hens.some((hen) => hen.state === "up") && draft.hens.some((hen) => hen.state === "down")) {
    draft.outcome = "wipe";

    return;
  }

  if (draft.hens.some((hen) => hen.state === "up" && hen.x >= stretch.gateX)) {
    draft.banked += resolveBordenHeartsCarried(draft.hens);
    draft.outcome = "cleared";

    return;
  }

  if (draft.tick >= WORLD.stretchCapTicks) {
    draft.outcome = "timeout";
  }
};

/**
 * The whole stretch, one tick. A terminal frame steps to itself. The inputs stamped at this
 * frame's tick apply first; then the hens run, jump and spray, the camera follows, what the window
 * has reached wakes, the geese run and the tank rolls, a shooter flashes or fires, the shots and
 * bodies land, the sauce lands and the puddles burn, the bottle is taken, a downed hen is stood
 * over, and the stretch is checked for its end.
 */
export const stepBorden = (frame: BordenFrame, stretch: BordenStretch, inputs: readonly BordenInput[]): BordenFrame => {
  if (frame.outcome !== null) {
    return frame;
  }

  const draft = draftFrame(frame);

  applyInputs(draft, inputs);
  draft.tick += 1;

  for (const hen of draft.hens) {
    stepHen(draft, hen);
  }

  moveCamera(draft, stretch);
  wakeSpawns(draft, stretch);
  clampHens(draft);
  stepFoes(draft);
  runFireControl(draft, stretch);
  stepShots(draft);
  resolveBodies(draft);
  stepSauce(draft);
  burnPuddles(draft);
  pickUpBottle(draft);
  resolveRevives(draft);
  tidyEvents(draft);
  resolveOutcome(draft, stretch);

  return draft;
};

/**
 * Steps the frame to `toTick`, applying each input at its own tick. `inputs` is the log in tick
 * order; inputs older than the frame are skipped, so a screen can hand over the whole log.
 */
export const advanceBorden = (
  frame: BordenFrame,
  stretch: BordenStretch,
  inputs: readonly BordenInput[],
  toTick: number
): BordenFrame => {
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

    current = stepBorden(current, stretch, from === cursor ? [] : inputs.slice(from, cursor));
  }

  return current;
};

/**
 * What the next pair carries in (spec §0.3): through a cleared gate, the hot bottles of the hens
 * who arrived with one, dealt to the new pair in slot order. After a wipe the next pair starts fresh.
 */
export const resolveBordenHandoffBottles = (frame: Pick<BordenFrame, "outcome" | "hens">): BordenBottle[] => {
  if (frame.outcome !== "cleared") {
    return [];
  }

  return frame.hens.filter((hen) => hen.state !== "down" && hen.bottle !== "mild").map((hen) => hen.bottle);
};
