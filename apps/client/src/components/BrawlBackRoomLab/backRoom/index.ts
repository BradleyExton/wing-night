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
  type BrawlCrewHen,
  type BrawlCrewInput
} from "@wingnight/shared";

// PROTOTYPE — throwaway (docs/minigames/ideas/brawl-back-room-finale.md §7). The back room's rules
// bolted ROUND the real crew sim, not into it: every tick the street's own `stepBrawlCrew` runs
// block 2 as it stands, and this file then reads the frame and adds one sleeping body to it —
// lifted, carried, dropped, dragged back by the staff, and worth what is left in his wallet. It
// answers "is this fun" and nothing else. If the answer is yes, the rules go into
// `packages/shared` properly and this file is deleted.

const WORLD = BRAWL_CREW_WORLD;

export type BackRoomMode = "carry" | "herd";

export type BackRoomStaffPace = "off" | "few" | "lots";

export type BackRoomSettings = {
  /** Carry: stand over him to lift him, a peck or a hit drops him. Herd: a peck shoves him along. */
  mode: BackRoomMode;
  /** How often the staff come out of the back room for him to drag him back, if at all. */
  staff: BackRoomStaffPace;
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
  /**
   * The staff. Once the crew has moved him, one comes out of the back room for him every so often
   * (`staffEveryTicks`, by the pace set), shared between as many as may be out at once
   * (`resolveBackRoomStaffCrew`), the first after `staffFirstTicks`. They run faster than a hen
   * walks, never mind one carrying.
   */
  staffEveryTicks: { off: 0, few: 6 * 60, lots: 3.5 * 60 },
  staffFirstTicks: 2 * 60,
  staffSpeed: 1.25,
  staffDepthSpeed: 0.9,
  staffHalfWidth: 5,
  /**
   * How far behind him one stands to pull, past its own half-width: an arm's length, so a hen
   * stood over him pecking the way she faces does not reach it. She has to turn round.
   */
  staffArm: 9,
  /** Units a tick one that has him drags him back the way he came, and what each more adds. */
  dragSpeed: 0.45,
  dragSpeedPerExtra: 0.15,
  /** How many pecks one that HAS him shrugs off before the next puts it down. One on its way has none. */
  staffGrip: 1,
  /** How close one gets to a hen carrying him, and how long it tugs before he comes off her back. */
  staffGrabReach: 9,
  staffGrabTicks: 24,
  /** How long one that has been put down lies there. */
  staffFallTicks: 30,
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
  /** Whether any of the staff has hold of him this tick. */
  isDragged: boolean;
  /** The tick the crew first moved him: nobody comes for him before it. */
  movedTick: number | null;
};

/**
 * One of the staff, out of the back room for him. It is the prototype's own figure, not a goon of
 * the sim's: the wave does not count it, the bots do not see it, and it is worth nothing.
 */
export type BackRoomStaff = {
  id: number;
  x: number;
  z: number;
  facing: -1 | 1;
  /** It has hold of him and is pulling. */
  hasHim: boolean;
  /** Pecks it will still shrug off while it has him. */
  grip: number;
  /** The tick it reached the hen carrying him and began to tug, or null. */
  grabSinceTick: number | null;
  /** The tick it was put down, or null while it stands. */
  koTick: number | null;
};

export type BackRoomOutcome = "out" | "broke" | "wipe";

export type BackRoomTally = { lifts: number; drops: number; carried: number; staff: number };

export type BackRoomRun = {
  settings: BackRoomSettings;
  block: BrawlCrewBlock;
  frame: BrawlCrewFrame;
  sleeper: BackRoomSleeper;
  staff: BackRoomStaff[];
  staffSent: number;
  nextStaffTick: number;
  /** How far the staff have dragged him back, all told. */
  draggedBack: number;
  billsLeft: number;
  lastChargeTick: number | null;
  lastDropTick: number | null;
  /** Per slot: the peck (by the tick it ends) that has already found the staff or him. */
  spentPecks: number[];
  tallies: BackRoomTally[];
  outcome: BackRoomOutcome | null;
  /** The worth banked, and everything the block held: its own total and the whole wallet. */
  banked: number;
  total: number;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const toward = (from: number, to: number, step: number): number => from + clamp(to - from, -step, step);

export const resolveBackRoomClockTicks = (settings: BackRoomSettings): number => settings.clockSeconds * WORLD.tickHz;

/**
 * How many of the staff may be out for him at once: one for each PERSON on the street. The bots
 * neither see the staff nor guard him, so only people can answer them; in the real game, where
 * every hen is a person, this would be a share of the crew.
 */
export const resolveBackRoomStaffCrew = (humans: number): number => Math.max(1, humans);

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
      isDragged: false,
      movedTick: null
    },
    staff: [],
    staffSent: 0,
    nextStaffTick: 0,
    draggedBack: 0,
    billsLeft: BACK_ROOM.bills,
    lastChargeTick: null,
    lastDropTick: null,
    spentPecks: Array.from({ length: crew }, () => -1),
    tallies: Array.from({ length: crew }, () => ({ lifts: 0, drops: 0, carried: 0, staff: 0 })),
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
          carried: tally.carried + (change.carried ?? 0),
          staff: tally.staff + (change.staff ?? 0)
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

/**
 * Whether her beak is out, live and free — it has not found a goose — over something `halfWidth`
 * wide at `(x, z)`: the street's own peck box, from her back edge to her reach.
 */
const isBeakOn = (hen: BrawlCrewHen, tick: number, x: number, z: number, halfWidth: number): boolean => {
  if (hen.state !== "up" || hen.peckLanded || tick >= hen.peckUntilTick || tick < hen.peckUntilTick - WORLD.peckActiveTicks) {
    return false;
  }

  const back = hen.x - hen.facing * WORLD.henRadius;
  const front = hen.x + hen.facing * (WORLD.henRadius + WORLD.peckReach);

  return (
    x + halfWidth >= Math.min(back, front) &&
    x - halfWidth <= Math.max(back, front) &&
    Math.abs(hen.z - z) <= WORLD.peckDepthBand
  );
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
      sleeper = {
        ...sleeper,
        carrier: lifter.slot,
        liftSinceTick: null,
        lifter: null,
        movedTick: sleeper.movedTick ?? tick,
        isDragged: false,
        vx: 0
      };
      tallies = withTally(tallies, lifter.slot, { lifts: 1 });
    } else {
      sleeper = { ...sleeper, liftSinceTick: sleeper.liftSinceTick ?? tick, lifter: lifter.slot };
    }
  }

  // The staff. A beak finds one of them before it finds him: one on its way goes down to a peck,
  // one that has him shrugs the first off.
  let spentPecks = run.spentPecks;
  let staff = run.staff.filter((one) => one.koTick === null || tick - one.koTick < BACK_ROOM.staffFallTicks);
  let { staffSent, nextStaffTick, draggedBack } = run;

  for (const hen of frame.hens) {
    if (spentPecks[hen.slot] === hen.peckUntilTick) {
      continue;
    }

    const hit = staff.find((one) => one.koTick === null && isBeakOn(hen, tick, one.x, one.z, BACK_ROOM.staffHalfWidth));

    if (hit === undefined) {
      continue;
    }

    const isShrugged = hit.hasHim && hit.grip > 0;

    spentPecks = spentPecks.map((value, slot) => (slot === hen.slot ? hen.peckUntilTick : value));
    staff = staff.map((one) => (one === hit ? (isShrugged ? { ...one, grip: one.grip - 1 } : { ...one, koTick: tick, hasHim: false }) : one));
    tallies = isShrugged ? tallies : withTally(tallies, hen.slot, { staff: 1 });
  }

  // Herding him: any live beak over him that has found nothing else shoves him the way she faces.
  if (settings.mode === "herd") {
    for (const hen of frame.hens) {
      if (spentPecks[hen.slot] !== hen.peckUntilTick && isBeakOn(hen, tick, sleeper.x, sleeper.z, 0)) {
        spentPecks = spentPecks.map((value, slot) => (slot === hen.slot ? hen.peckUntilTick : value));
        sleeper = { ...sleeper, vx: hen.facing * BACK_ROOM.herdShove, movedTick: sleeper.movedTick ?? tick };
      }
    }

    if (sleeper.vx !== 0) {
      const vx = Math.abs(sleeper.vx) < 0.05 ? 0 : sleeper.vx * BACK_ROOM.herdFriction;

      sleeper = { ...sleeper, x: sleeper.x + sleeper.vx, vx };
    }
  }

  if (settings.staff !== "off" && sleeper.movedTick !== null) {
    const staffCrew = resolveBackRoomStaffCrew(settings.humans);

    // Another one comes out of the back room: in from behind, on his line.
    if (sleeper.movedTick === tick) {
      nextStaffTick = tick + BACK_ROOM.staffFirstTicks;
    } else if (tick >= nextStaffTick && staff.filter((one) => one.koTick === null).length < staffCrew) {
      staff = [
        ...staff,
        {
          id: staffSent,
          x: frame.cameraX - BACK_ROOM.staffHalfWidth - 2,
          z: sleeper.z,
          facing: 1,
          hasHim: false,
          grip: BACK_ROOM.staffGrip,
          grabSinceTick: null,
          koTick: null
        }
      ];
      staffSent += 1;
      nextStaffTick = tick + Math.floor(BACK_ROOM.staffEveryTicks[settings.staff] / staffCrew);
    }

    const carrier = sleeper.carrier === null ? undefined : frame.hens[sleeper.carrier];
    let isTuggedOff = false;

    staff = staff.map((one): BackRoomStaff => {
      if (one.koTick !== null) {
        return one;
      }

      // Carried: it runs her down and tugs. If nobody pecks it in time, he comes off her back.
      if (carrier !== undefined) {
        const x = toward(one.x, carrier.x - BACK_ROOM.staffGrabReach, BACK_ROOM.staffSpeed);
        const z = toward(one.z, carrier.z, BACK_ROOM.staffDepthSpeed);
        const isOnHer = Math.abs(carrier.x - x) <= BACK_ROOM.staffGrabReach + 1 && Math.abs(carrier.z - z) <= 2;
        const grabSinceTick = isOnHer ? (one.grabSinceTick ?? tick) : null;

        isTuggedOff = isTuggedOff || (grabSinceTick !== null && tick - grabSinceTick >= BACK_ROOM.staffGrabTicks);

        return { ...one, x, z, facing: x <= carrier.x ? 1 : -1, hasHim: false, grabSinceTick };
      }

      // On the floor: it runs to an arm's length behind him and takes hold.
      const holdX = sleeper.x - BACK_ROOM.staffHalfWidth - BACK_ROOM.staffArm;
      const x = toward(one.x, holdX, BACK_ROOM.staffSpeed);
      const z = toward(one.z, sleeper.z, BACK_ROOM.staffDepthSpeed);

      return { ...one, x, z, facing: 1, grabSinceTick: null, hasHim: Math.abs(x - holdX) <= 1 && Math.abs(z - sleeper.z) <= 1 };
    });

    if (isTuggedOff) {
      drop(tick);
      staff = staff.map((one) => (one.grabSinceTick === null ? one : { ...one, grabSinceTick: null }));
    }

    // Whoever has him pulls him back the way he came, as far as the window's edge.
    const holders = sleeper.carrier === null ? staff.filter((one) => one.koTick === null && one.hasHim).length : 0;
    // He stops far enough in from the edge that the one pulling him is still on the screen to peck.
    const floor = frame.cameraX + WORLD.henMargin + 2 * BACK_ROOM.staffHalfWidth + BACK_ROOM.staffArm;
    const pull = holders === 0 ? 0 : BACK_ROOM.dragSpeed + (holders - 1) * BACK_ROOM.dragSpeedPerExtra;
    const x = Math.max(Math.min(sleeper.x, floor), sleeper.x - pull);

    draggedBack += sleeper.x - x;
    sleeper = { ...sleeper, x, isDragged: holders > 0, vx: holders > 0 ? 0 : sleeper.vx };
    staff = staff.map((one) =>
      one.koTick === null && one.hasHim ? { ...one, x: x - BACK_ROOM.staffHalfWidth - BACK_ROOM.staffArm } : one
    );
  }

  // Once the crew has moved him he stays in the window like any hen.
  if (sleeper.movedTick !== null && sleeper.carrier === null) {
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

  return {
    ...run,
    frame,
    sleeper,
    staff,
    staffSent,
    nextStaffTick,
    draggedBack,
    billsLeft,
    lastChargeTick,
    lastDropTick,
    spentPecks,
    tallies,
    outcome,
    banked
  };
};
