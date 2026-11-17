import {
  BRAWL_CREW_WORLD,
  brawlCrewBrawler,
  createBrawlCrewStart,
  isBrawlCrewHenPecking,
  resolveBrawlCrewBlock,
  resolveBrawlCrewBotInputs,
  resolveBrawlCrewHeartsCarried,
  stepBrawlCrew,
  type BrawlCrewBlock,
  type BrawlCrewFrame,
  type BrawlCrewGoon,
  type BrawlCrewHen,
  type BrawlCrewInput
} from "@wingnight/shared";

// PROTOTYPE — throwaway (docs/minigames/ideas/brawl-back-room-finale.md §7). The back room's rules
// bolted ROUND the real crew sim, not into it: every tick the street's own `stepBrawlCrew` runs
// block 2 as it stands, and this file then reads the frame and adds one sleeping body to it —
// lifted, carried, dropped, dragged back, and worth what is left in his wallet. It answers "is
// this fun" and nothing else. If the answer is yes, the rules go into `packages/shared` properly
// (a goon really targets him, the camera really waits for him) and this file is deleted.

const WORLD = BRAWL_CREW_WORLD;

export type BackRoomMode = "carry" | "herd";

export type BackRoomSettings = {
  /** Carry: stand over him to lift him, a peck or a hit drops him. Herd: a peck shoves him along. */
  mode: BackRoomMode;
  /** Whether one of the staff comes for him and drags him back. */
  isDragOn: boolean;
  /** The block's clock, which is his wallet. */
  clockSeconds: 90 | 120;
  /** Whether a bill leaves every ten seconds, or the wallet only runs out at the bell. */
  isChargeOn: boolean;
  /** Hens on the street, and how many of them are people: the rest are the sim's brawler bots. */
  crew: number;
  humans: number;
  seed: number;
};

export const BACK_ROOM = {
  bills: 8,
  billDollars: 20,
  /** A song: a bill goes at the end of each of the last eight. */
  songTicks: 10 * 60,
  /** Lifting him is the revive: the same count, the same reach. */
  liftTicks: WORLD.reviveTicks,
  liftReach: WORLD.reviveReach,
  liftBand: WORLD.peckDepthBand,
  /** A hen with him on her back walks at this share of her speed. */
  carryShare: 0.6,
  /** Units a tick the goon that has him drags him back the way he came. */
  dragSpeed: 0.35,
  /** The goon that is on him hurries: this many times its own walk, so it reaches him inside a wave. */
  dragHurry: 1.8,
  /** How long the staff leave him alone after the goon on him is pecked. */
  dragRestTicks: 60,
  /** The camera goes no further than this far short of him: nobody leaves without him. */
  cameraLead: 30,
  /** Herd: what one peck gives him, and how fast he stops. */
  herdShove: 2.4,
  herdFriction: 0.88,
  /** The couch: the middle of the second window, against the back wall. */
  sleeperX: WORLD.width + 100,
  sleeperZ: 6
} as const;

export type BackRoomSleeper = {
  x: number;
  z: number;
  vx: number;
  /** The slot of the hen who has him, or null while he is on the floor. */
  carrier: number | null;
  /** The tick a hen started standing over him, and who. */
  liftSinceTick: number | null;
  lifter: number | null;
  /** The goon that is on him, by spawn index. */
  dragger: number | null;
  draggerRestUntilTick: number;
  /** Whether that goon has hold of him this tick. */
  isDragged: boolean;
  /** Nothing comes for him until the crew has moved him once. */
  isMoved: boolean;
};

export type BackRoomOutcome = "out" | "broke" | "wipe";

export type BackRoomTally = { lifts: number; drops: number; carried: number };

export type BackRoomRun = {
  settings: BackRoomSettings;
  block: BrawlCrewBlock;
  frame: BrawlCrewFrame;
  sleeper: BackRoomSleeper;
  billsLeft: number;
  lastChargeTick: number | null;
  lastDropTick: number | null;
  /** Per slot: the peck (by the tick it ends) that has already shoved him, in herd mode. */
  shovedPecks: number[];
  tallies: BackRoomTally[];
  outcome: BackRoomOutcome | null;
  /** The worth banked, and everything the block held: its own total and the whole wallet. */
  banked: number;
  total: number;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const toward = (from: number, to: number, step: number): number => from + clamp(to - from, -step, step);

const isStanding = (goon: BrawlCrewGoon): boolean => goon.state !== "ko" && goon.state !== "gone";

export const resolveBackRoomClockTicks = (settings: BackRoomSettings): number => settings.clockSeconds * WORLD.tickHz;

/** The bills still in the wallet at a tick: one goes at the end of each of the last eight songs. */
export const resolveBackRoomBills = (settings: BackRoomSettings, tick: number): number => {
  if (!settings.isChargeOn) {
    return BACK_ROOM.bills;
  }

  const firstCharge = resolveBackRoomClockTicks(settings) - (BACK_ROOM.bills - 1) * BACK_ROOM.songTicks;

  return tick < firstCharge
    ? BACK_ROOM.bills
    : Math.max(0, BACK_ROOM.bills - 1 - Math.floor((tick - firstCharge) / BACK_ROOM.songTicks));
};

export const createBackRoomRun = (settings: BackRoomSettings): BackRoomRun => {
  const crew = clamp(Math.floor(settings.crew), 1, 5);
  const block = resolveBrawlCrewBlock({ seed: settings.seed, blocks: 3, block: 2, crew });

  return {
    settings: { ...settings, crew, humans: clamp(Math.floor(settings.humans), 1, crew) },
    block,
    frame: createBrawlCrewStart(block),
    sleeper: {
      x: BACK_ROOM.sleeperX,
      z: BACK_ROOM.sleeperZ,
      vx: 0,
      carrier: null,
      liftSinceTick: null,
      lifter: null,
      dragger: null,
      draggerRestUntilTick: 0,
      isDragged: false,
      isMoved: false
    },
    billsLeft: BACK_ROOM.bills,
    lastChargeTick: null,
    lastDropTick: null,
    shovedPecks: Array.from({ length: crew }, () => -1),
    tallies: Array.from({ length: crew }, () => ({ lifts: 0, drops: 0, carried: 0 })),
    outcome: null,
    banked: 0,
    total: block.total + BACK_ROOM.bills * crew
  };
};

const withTally = (tallies: readonly BackRoomTally[], slot: number, change: Partial<BackRoomTally>): BackRoomTally[] => {
  return tallies.map((tally, index) =>
    index === slot
      ? {
          lifts: tally.lifts + (change.lifts ?? 0),
          drops: tally.drops + (change.drops ?? 0),
          carried: tally.carried + (change.carried ?? 0)
        }
      : tally
  );
};

/** Whether this hen is doing what gets a fallen friend up: standing still, beak in, beside him. */
const canLift = (hen: BrawlCrewHen, sleeper: BackRoomSleeper, tick: number): boolean => {
  return (
    hen.state === "up" &&
    hen.walk === 0 &&
    !hen.peckHeld &&
    !isBrawlCrewHenPecking(hen, tick) &&
    tick >= hen.hurtUntilTick &&
    Math.abs(hen.x - sleeper.x) <= BACK_ROOM.liftReach &&
    Math.abs(hen.z - sleeper.z) <= BACK_ROOM.liftBand
  );
};

/** Whether her beak is out and live over him, in herd mode: the street's own peck box. */
const isPeckOn = (hen: BrawlCrewHen, sleeper: BackRoomSleeper, tick: number): boolean => {
  if (hen.state !== "up" || hen.peckLanded || tick >= hen.peckUntilTick || tick < hen.peckUntilTick - WORLD.peckActiveTicks) {
    return false;
  }

  const back = hen.x - hen.facing * WORLD.henRadius;
  const front = hen.x + hen.facing * (WORLD.henRadius + WORLD.peckReach);

  return (
    sleeper.x >= Math.min(back, front) &&
    sleeper.x <= Math.max(back, front) &&
    Math.abs(hen.z - sleeper.z) <= WORLD.peckDepthBand
  );
};

/** Who comes for him: the bouncer if he is in, else the nearest walker with nothing better to do. */
const pickDragger = (frame: BrawlCrewFrame, sleeper: BackRoomSleeper): number | null => {
  let best: BrawlCrewGoon | null = null;

  for (const goon of frame.goons) {
    if (!isStanding(goon) || goon.kind === "gull" || (goon.state !== "approach" && goon.state !== "stalk")) {
      continue;
    }

    if (goon.kind === "boss") {
      return goon.spawnIndex;
    }

    if (best === null || Math.abs(goon.x - sleeper.x) < Math.abs(best.x - sleeper.x)) {
      best = goon;
    }
  }

  return best === null ? null : best.spawnIndex;
};

const wasPecked = (frame: BrawlCrewFrame, previous: BrawlCrewGoon | undefined, goon: BrawlCrewGoon): boolean => {
  return (
    (previous !== undefined && goon.hp < previous.hp) ||
    frame.events.some((event) => event.tick === frame.tick && event.spawnIndex === goon.spawnIndex && event.kind !== "drop")
  );
};

/**
 * The staff put him back. One goon is "on him": while he is carried it is on his carrier (the
 * street's own script does the rest); while he is on the floor it walks to him and drags him back
 * until it is pecked. Here the prototype takes that goon's legs over — its place is written after
 * the sim's step, and its own script is held at `approach` so it never honks while it has him.
 */
const stepDrag = (
  before: BrawlCrewFrame,
  frame: BrawlCrewFrame,
  sleeper: BackRoomSleeper
): { frame: BrawlCrewFrame; sleeper: BackRoomSleeper } => {
  const tick = frame.tick;
  let dragger = sleeper.dragger;
  const held = dragger === null ? undefined : frame.goons.find((goon) => goon.spawnIndex === dragger);
  const previous = dragger === null ? undefined : before.goons.find((goon) => goon.spawnIndex === dragger);

  if (dragger !== null && (held === undefined || !isStanding(held) || wasPecked(frame, previous, held))) {
    return { frame, sleeper: { ...sleeper, dragger: null, isDragged: false, draggerRestUntilTick: tick + BACK_ROOM.dragRestTicks } };
  }

  if (dragger === null) {
    dragger = tick >= sleeper.draggerRestUntilTick && frame.cameraLocked ? pickDragger(frame, sleeper) : null;

    if (dragger === null) {
      return { frame, sleeper: sleeper.isDragged ? { ...sleeper, isDragged: false } : sleeper };
    }
  }

  const goon = frame.goons.find((entry) => entry.spawnIndex === dragger);

  if (goon === undefined) {
    return { frame, sleeper: { ...sleeper, dragger: null, isDragged: false } };
  }

  // Carried: the goon is on his carrier, and the street's script lines it up and lunges.
  if (sleeper.carrier !== null) {
    const isFree = goon.state === "approach" || goon.state === "stalk";
    const goons =
      isFree && goon.target !== sleeper.carrier
        ? frame.goons.map((entry) => (entry === goon ? { ...entry, target: sleeper.carrier, state: "approach" as const } : entry))
        : frame.goons;

    return { frame: goons === frame.goons ? frame : { ...frame, goons }, sleeper: { ...sleeper, dragger, isDragged: false } };
  }

  // A goon in the middle of a honk or a lunge finishes it before it turns to him.
  if (goon.state !== "approach" && goon.state !== "stalk") {
    return { frame, sleeper: { ...sleeper, dragger, isDragged: false } };
  }

  // On the floor: it walks to his far side and pulls.
  const stats = WORLD.goons[goon.kind];
  const from = previous ?? goon;
  const holdX = sleeper.x - stats.halfWidth - 2;
  const speed = stats.speed * BACK_ROOM.dragHurry;
  const x = toward(from.x, holdX, speed);
  const z = toward(from.z, sleeper.z, speed * WORLD.goonLineSpeedShare);
  const hasHim = Math.abs(x - holdX) <= 1 && Math.abs(z - sleeper.z) <= 1;
  const floor = frame.cameraX + WORLD.henMargin;
  const pulledX = hasHim ? Math.max(floor, sleeper.x - BACK_ROOM.dragSpeed) : sleeper.x;
  const placed: BrawlCrewGoon = {
    ...goon,
    x: hasHim ? pulledX - stats.halfWidth - 2 : x,
    z,
    y: 0,
    vx: 0,
    vy: 0,
    facing: x <= sleeper.x ? 1 : -1,
    state: "approach"
  };

  return {
    frame: { ...frame, goons: frame.goons.map((entry) => (entry === goon ? placed : entry)) },
    sleeper: { ...sleeper, x: pulledX, dragger, isDragged: hasHim }
  };
};

/**
 * Nobody leaves without him. The street's camera follows the hen furthest along; this holds it a
 * little short of him, and takes back a wave it opened by getting ahead of him.
 */
const holdCamera = (before: BrawlCrewFrame, frame: BrawlCrewFrame, block: BrawlCrewBlock, sleeper: BackRoomSleeper): BrawlCrewFrame => {
  const cap = sleeper.x - BACK_ROOM.cameraLead;

  if (frame.cameraX <= cap || frame.cameraX <= before.cameraX) {
    return frame;
  }

  const cameraX = Math.max(before.cameraX, cap);
  const lockX = block.waves[frame.waveIndex]?.lockX;
  const isLockTaken = frame.cameraLocked && !before.cameraLocked && lockX !== undefined && cameraX < lockX;

  if (!isLockTaken) {
    return { ...frame, cameraX };
  }

  return {
    ...frame,
    cameraX,
    cameraLocked: false,
    waveOpenedTick: before.waveOpenedTick,
    wingDropped: before.wingDropped,
    spawned: before.spawned,
    goons: frame.goons.filter((goon) => goon.spawnIndex < before.spawned)
  };
};

/**
 * One tick of the back room. `thumbs` are the people's inputs for this tick, stamped as the
 * street's sim wants them; the bots' are added here.
 */
export const stepBackRoom = (run: BackRoomRun, thumbs: readonly BrawlCrewInput[]): BackRoomRun => {
  if (run.outcome !== null) {
    return run;
  }

  const { settings, block } = run;
  const before = run.frame;
  const bots = Array.from({ length: settings.crew }, (_unused, slot) => (slot < settings.humans ? null : brawlCrewBrawler));
  const inputs = [...thumbs, ...resolveBrawlCrewBotInputs(before, block, bots)];
  let sleeper = run.sleeper;
  let tallies = run.tallies;
  let lastDropTick = run.lastDropTick;

  const drop = (tick: number): void => {
    if (sleeper.carrier !== null) {
      tallies = withTally(tallies, sleeper.carrier, { drops: 1 });
      sleeper = { ...sleeper, carrier: null };
      lastDropTick = tick;
    }
  };

  // A press of PECK puts him down, and pecks.
  if (inputs.some((input) => input.kind === "peck" && input.held && input.hen === sleeper.carrier)) {
    drop(before.tick);
  }

  let frame = stepBrawlCrew(before, block, inputs);
  const tick = frame.tick;
  const clockTicks = resolveBackRoomClockTicks(settings);

  // The street thinks a hen over the line is the end, and that ninety seconds is. Neither is here.
  if (frame.outcome === "cleared") {
    frame = { ...frame, outcome: null, banked: frame.banked - resolveBrawlCrewHeartsCarried(frame.hens) };
  } else if (frame.outcome === "timeout" && tick < clockTicks) {
    frame = { ...frame, outcome: null };
  }

  // Carried: a hit or a fall drops him; otherwise she walks slower and he goes where she goes.
  if (sleeper.carrier !== null) {
    const slot = sleeper.carrier;
    const hen = frame.hens[slot];
    const was = before.hens[slot];
    const isHit = frame.events.some((event) => event.tick === tick && event.kind === "hit" && event.hen === slot);

    if (hen === undefined || was === undefined || hen.state !== "up" || isHit) {
      drop(tick);
    } else {
      const x = was.x + (hen.x - was.x) * BACK_ROOM.carryShare;
      const z = was.z + (hen.z - was.z) * BACK_ROOM.carryShare;

      frame = { ...frame, hens: frame.hens.map((entry) => (entry.slot === slot ? { ...entry, x, z } : entry)) };
      tallies = withTally(tallies, slot, { carried: Math.max(0, x - was.x) });
      sleeper = { ...sleeper, x, z };
    }
  }

  // Lifting him: a person standing still over him for as long as a revive takes. Bots never do.
  if (settings.mode === "carry" && sleeper.carrier === null) {
    const lifter = frame.hens.find((hen) => hen.slot < settings.humans && canLift(hen, sleeper, tick));

    if (lifter === undefined) {
      sleeper = sleeper.liftSinceTick === null ? sleeper : { ...sleeper, liftSinceTick: null, lifter: null };
    } else if (tick - (sleeper.liftSinceTick ?? tick) >= BACK_ROOM.liftTicks) {
      sleeper = { ...sleeper, carrier: lifter.slot, liftSinceTick: null, lifter: null, isMoved: true, isDragged: false, vx: 0 };
      tallies = withTally(tallies, lifter.slot, { lifts: 1 });
    } else {
      sleeper = { ...sleeper, liftSinceTick: sleeper.liftSinceTick ?? tick, lifter: lifter.slot };
    }
  }

  // Herding him: any live beak over him that has not found a goose shoves him the way she faces.
  let shovedPecks = run.shovedPecks;

  if (settings.mode === "herd") {
    for (const hen of frame.hens) {
      if (shovedPecks[hen.slot] !== hen.peckUntilTick && isPeckOn(hen, sleeper, tick)) {
        shovedPecks = shovedPecks.map((value, slot) => (slot === hen.slot ? hen.peckUntilTick : value));
        sleeper = { ...sleeper, vx: hen.facing * BACK_ROOM.herdShove, isMoved: true };
      }
    }

    if (sleeper.vx !== 0) {
      const vx = Math.abs(sleeper.vx) < 0.05 ? 0 : sleeper.vx * BACK_ROOM.herdFriction;

      sleeper = { ...sleeper, x: sleeper.x + sleeper.vx, vx };
    }
  }

  if (settings.isDragOn && sleeper.isMoved) {
    const dragged = stepDrag(before, frame, sleeper);

    frame = dragged.frame;
    sleeper = dragged.sleeper;
  }

  // Once the crew has moved him he stays in the window like any hen.
  if (sleeper.isMoved && sleeper.carrier === null) {
    const x = clamp(sleeper.x, frame.cameraX + WORLD.henMargin, frame.cameraX + WORLD.width - WORLD.henMargin);

    sleeper = x === sleeper.x ? sleeper : { ...sleeper, x, vx: 0 };
  }

  frame = holdCamera(before, frame, block, sleeper);

  const billsLeft = resolveBackRoomBills(settings, tick);
  const lastChargeTick = billsLeft < run.billsLeft ? tick : run.lastChargeTick;
  const isOut = frame.waveIndex >= block.waves.length && sleeper.x >= block.exitX;
  const outcome: BackRoomOutcome | null = isOut ? "out" : frame.outcome === "wipe" ? "wipe" : tick >= clockTicks ? "broke" : null;
  const banked = isOut
    ? frame.banked + resolveBrawlCrewHeartsCarried(frame.hens) + billsLeft * settings.crew
    : frame.banked;

  return { ...run, frame, sleeper, billsLeft, lastChargeTick, lastDropTick, shovedPecks, tallies, outcome, banked };
};
