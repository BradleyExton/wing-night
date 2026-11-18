import assert from "node:assert/strict";
import test from "node:test";

import {
  BRAWL_CREW_WORLD,
  brawlCrewBrawler,
  resolveBrawlCrewBotInputs,
  type BrawlCrewBot,
  type BrawlCrewWalk
} from "@wingnight/shared";

import {
  BACK_ROOM,
  createBackRoomRun,
  resolveBackRoomBills,
  resolveBackRoomClockTicks,
  stepBackRoom,
  type BackRoomRun,
  type BackRoomSettings
} from "./index";

const SETTINGS: BackRoomSettings = {
  mode: "carry",
  staff: "few",
  clockSeconds: 120,
  isChargeOn: true,
  crew: 3,
  humans: 1,
  seed: 20261001
};

const DIRS: Record<string, BrawlCrewWalk> = {
  "0,0": 0,
  "1,0": 1,
  "1,1": 2,
  "0,1": 3,
  "-1,1": 4,
  "-1,0": 5,
  "-1,-1": 6,
  "0,-1": 7,
  "1,-1": 8
};

const sign = (value: number, slack: number): number => (value > slack ? 1 : value < -slack ? -1 : 0);

/**
 * A person playing it, for slot 0. She fights like a brawler while there is a goose to fight, and
 * otherwise walks to him, stands over him and carries him to the door. `isGuard` is whether she
 * also answers the staff: puts him down when one is close, turns to it and pecks it.
 */
const createPorter = (read: () => BackRoomRun, isGuard: boolean): BrawlCrewBot => {
  return (frame, block, slot) => {
    const { sleeper, staff } = read();
    const hen = frame.hens[slot];

    if (hen === undefined) {
      return { dir: 0, held: false };
    }

    const one = staff
      .filter((entry) => entry.koTick === null)
      .sort((left, right) => Math.abs(left.x - sleeper.x) - Math.abs(right.x - sleeper.x))[0];

    if (isGuard && one !== undefined && Math.abs(one.x - hen.x) < 70) {
      const dx = one.x - hen.x;
      const facing = dx < 0 ? -1 : 1;

      if (sleeper.carrier === slot) {
        return Math.abs(dx) < 40 ? { dir: 0, held: true } : { dir: 1, held: false };
      }

      if (hen.facing !== facing) {
        return { dir: facing === 1 ? 1 : 5, held: false };
      }

      return Math.abs(dx) <= 18 && Math.abs(one.z - hen.z) <= 6
        ? { dir: 0, held: true }
        : { dir: DIRS[`${sign(dx, 14)},${sign(one.z - hen.z, 4)}`] ?? 0, held: false };
    }

    if (frame.goons.some((goon) => goon.state !== "ko" && goon.state !== "gone")) {
      return brawlCrewBrawler(frame, block, slot);
    }

    if (sleeper.carrier === slot) {
      return { dir: 1, held: false };
    }

    return { dir: DIRS[`${sign(sleeper.x - hen.x, 4)},${sign(sleeper.z - hen.z, 3)}`] ?? 0, held: false };
  };
};

const play = (settings: BackRoomSettings, isGuard: boolean): BackRoomRun => {
  let run = createBackRoomRun(settings);
  const porter = createPorter(() => run, isGuard);

  while (run.outcome === null && run.frame.tick < resolveBackRoomClockTicks(settings) + 10) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
  }

  return run;
};

/** Steps until he is on slot 0's back, with nobody coming for him. */
const liftHim = (settings: BackRoomSettings): BackRoomRun => {
  let run = createBackRoomRun({ ...settings, staff: "off" });
  const porter = createPorter(() => run, false);

  while (run.sleeper.carrier === null && run.outcome === null) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
  }

  assert.equal(run.sleeper.carrier, 0);

  return run;
};

test("does keep the whole wallet through the grace and lose a bill a song after it", () => {
  assert.equal(resolveBackRoomBills(SETTINGS, 0), 8);
  assert.equal(resolveBackRoomBills(SETTINGS, 50 * 60 - 1), 8);
  assert.equal(resolveBackRoomBills(SETTINGS, 50 * 60), 7);
  assert.equal(resolveBackRoomBills(SETTINGS, 119 * 60), 1);
  assert.equal(resolveBackRoomBills(SETTINGS, 120 * 60), 0);
  assert.equal(resolveBackRoomBills({ ...SETTINGS, clockSeconds: 90 }, 20 * 60), 7);
  assert.equal(resolveBackRoomBills({ ...SETTINGS, isChargeOn: false }, 119 * 60), 8);
});

test("does not end the block when a hen walks out without him", () => {
  // Bots never lift him, so a crew of nothing but brawlers clears every wave and stands at the door.
  let run = createBackRoomRun({ ...SETTINGS, crew: 2, humans: 1, clockSeconds: 90 });

  while (run.outcome === null) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [brawlCrewBrawler]));
  }

  assert.equal(run.outcome, "broke");
  assert.equal(run.sleeper.x, BACK_ROOM.sleeperX);
  assert.ok(run.frame.cameraX <= BACK_ROOM.sleeperX - BACK_ROOM.cameraLead, "the camera waited for him");
  assert.equal(run.billsLeft, 0);
  assert.equal(run.staffSent, 0, "nobody comes for him until the crew has moved him");
});

test("does get him out when the hen carrying him also keeps the staff off him", () => {
  for (const crew of [1, 3]) {
    const run = play({ ...SETTINGS, crew }, true);

    assert.equal(run.outcome, "out", `a crew of ${crew} got him out`);
    assert.ok(run.sleeper.x >= run.block.exitX);
    assert.ok((run.tallies[0]?.lifts ?? 0) >= 1);
    assert.ok((run.tallies[0]?.staff ?? 0) >= 1, "she had staff to see off");
    assert.ok(run.banked > 0 && run.banked <= run.total);
  }
});

test("does never get him out when nobody answers the staff", () => {
  const run = play({ ...SETTINGS, crew: 3 }, false);

  assert.equal(run.outcome, "broke");
  assert.ok(run.draggedBack > 200, `dragged back ${run.draggedBack}`);
  assert.ok(run.sleeper.x < run.block.exitX);
});

test("does get him out with no trouble when the staff are switched off", () => {
  const run = play({ ...SETTINGS, crew: 3, staff: "off" }, false);

  assert.equal(run.outcome, "out");
  assert.equal(run.staffSent, 0);
  assert.equal(run.draggedBack, 0);
  assert.equal(run.billsLeft, 8);
});

test("does drop him when the hen carrying him pecks", () => {
  let run = liftHim({ ...SETTINGS, crew: 1 });

  run = stepBackRoom(run, [{ tick: run.frame.tick, hen: 0, kind: "peck", held: true }]);
  assert.equal(run.sleeper.carrier, null);
  assert.equal(run.tallies[0]?.drops, 1);
});

test("does walk a carrier slower than a hen with nothing on her back", () => {
  let run = liftHim({ ...SETTINGS, crew: 1 });
  const porter = createPorter(() => run, false);

  // The first tick puts him on her back, wherever within reach she stood.
  run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));

  const from = run.sleeper.x;

  for (let step = 0; step < 10; step += 1) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
  }

  const walked = (run.sleeper.x - from) / 10;

  assert.ok(Math.abs(walked - BRAWL_CREW_WORLD.henWalkSpeed * BACK_ROOM.carryShare) < 0.08, `${walked} a tick`);
});

test("does tug him off a carrier's back when one of the staff reaches her and nobody pecks it", () => {
  let run: BackRoomRun = { ...liftHim({ ...SETTINGS, crew: 1 }) };

  run = { ...run, settings: { ...run.settings, staff: "few" }, nextStaffTick: run.frame.tick };

  // She stands still with him on her back and lets it come.
  while (run.sleeper.carrier !== null && run.frame.tick < 60 * 60) {
    run = stepBackRoom(run, []);
  }

  assert.equal(run.sleeper.carrier, null, "he came off her back");
  assert.equal(run.tallies[0]?.drops, 1);

  const from = run.sleeper.x;

  for (let step = 0; step < 120; step += 1) {
    run = stepBackRoom(run, []);
  }

  assert.ok(run.sleeper.isDragged || run.sleeper.x < from, "and it is taking him back");
  assert.ok(run.sleeper.x >= run.frame.cameraX + BRAWL_CREW_WORLD.henMargin, "no further than the window's edge");
  assert.ok((run.staff[0]?.x ?? 0) >= run.frame.cameraX, "and the one pulling him is still on the screen");
});

test("does put one of the staff down with one peck on its way and two once it has him", () => {
  const base = liftHim({ ...SETTINGS, crew: 1 });
  const hen = base.frame.hens[0];

  assert.ok(hen !== undefined);

  const stand = (hasHim: boolean): BackRoomRun => ({
    ...base,
    sleeper: { ...base.sleeper, carrier: null },
    staff: [
      { id: 0, x: hen.x + hen.facing * 10, z: hen.z, facing: 1, hasHim, grip: BACK_ROOM.staffGrip, grabSinceTick: null, koTick: null }
    ]
  });
  const peck = (from: BackRoomRun): BackRoomRun => {
    let run = stepBackRoom(from, [{ tick: from.frame.tick, hen: 0, kind: "peck", held: true }]);

    run = stepBackRoom(run, [{ tick: run.frame.tick, hen: 0, kind: "peck", held: false }]);

    for (let step = 0; step < 24; step += 1) {
      run = stepBackRoom(run, []);
    }

    return run;
  };

  assert.notEqual(peck(stand(false)).staff[0]?.koTick ?? null, null, "one on its way goes down to a peck");

  const once = peck(stand(true));

  assert.equal(once.staff[0]?.koTick, null, "one that has him shrugs the first off");
  assert.equal(once.staff[0]?.grip, 0);
});

test("does shove him the way she faces when a hen pecks him in herd mode", () => {
  const start = createBackRoomRun({ ...SETTINGS, mode: "herd", crew: 1, staff: "off" });
  const hen = start.frame.hens[0];

  assert.ok(hen !== undefined);

  let run: BackRoomRun = { ...start, sleeper: { ...start.sleeper, x: hen.x + 8, z: hen.z } };
  const from = run.sleeper.x;

  run = stepBackRoom(run, [{ tick: run.frame.tick, hen: 0, kind: "peck", held: true }]);

  for (let step = 0; step < 30; step += 1) {
    run = stepBackRoom(run, step === 0 ? [{ tick: run.frame.tick, hen: 0, kind: "peck", held: false }] : []);
  }

  assert.ok(run.sleeper.x > from + 8, `shoved ${run.sleeper.x - from}`);
  assert.equal(run.sleeper.carrier, null);
  assert.equal(run.tallies[0]?.lifts, 0);
});
