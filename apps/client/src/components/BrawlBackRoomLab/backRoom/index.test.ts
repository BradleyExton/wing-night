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
  isDragOn: true,
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
 * A person playing it properly, for slot 0: fight like a brawler while there is a goose to fight,
 * put him down to do it, and otherwise walk to him, stand over him and carry him to the door.
 */
const createPorter = (read: () => BackRoomRun): BrawlCrewBot => {
  return (frame, block, slot) => {
    const { sleeper } = read();
    const hen = frame.hens[slot];
    const isFight = frame.goons.some((goon) => goon.state !== "ko" && goon.state !== "gone");

    if (hen === undefined || isFight) {
      return brawlCrewBrawler(frame, block, slot);
    }

    if (sleeper.carrier === slot) {
      return { dir: 1, held: false };
    }

    return { dir: DIRS[`${sign(sleeper.x - hen.x, 4)},${sign(sleeper.z - hen.z, 3)}`] ?? 0, held: false };
  };
};

const play = (settings: BackRoomSettings): BackRoomRun => {
  let run = createBackRoomRun(settings);
  const porter = createPorter(() => run);

  while (run.outcome === null && run.frame.tick < resolveBackRoomClockTicks(settings) + 10) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
  }

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
});

test("does get him out when one hen carries him and puts him down to fight", () => {
  for (const crew of [1, 3, 5]) {
    const run = play({ ...SETTINGS, crew });

    assert.equal(run.outcome, "out", `a crew of ${crew} got him out`);
    assert.ok(run.sleeper.x >= run.block.exitX);
    assert.ok((run.tallies[0]?.lifts ?? 0) >= 1);
    assert.ok(run.banked > 0 && run.banked <= run.total);
  }
});

test("does drop him when the hen carrying him pecks", () => {
  let run = createBackRoomRun({ ...SETTINGS, crew: 1, isDragOn: false });
  const porter = createPorter(() => run);

  while (run.sleeper.carrier === null && run.outcome === null) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
  }

  assert.equal(run.sleeper.carrier, 0);
  run = stepBackRoom(run, [{ tick: run.frame.tick, hen: 0, kind: "peck", held: true }]);
  assert.equal(run.sleeper.carrier, null);
  assert.equal(run.tallies[0]?.drops, 1);
});

test("does walk a carrier slower than a hen with nothing on her back", () => {
  let run = createBackRoomRun({ ...SETTINGS, crew: 1, isDragOn: false });
  const porter = createPorter(() => run);

  while (run.sleeper.carrier === null && run.outcome === null) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
  }

  // The first tick puts him on her back, wherever within reach she stood.
  run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));

  const from = run.sleeper.x;

  for (let step = 0; step < 10; step += 1) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
  }

  const walked = (run.sleeper.x - from) / 10;

  assert.ok(Math.abs(walked - BRAWL_CREW_WORLD.henWalkSpeed * BACK_ROOM.carryShare) < 0.08, `${walked} a tick`);
});

test("does shove him the way she faces when a hen pecks him in herd mode", () => {
  const start = createBackRoomRun({ ...SETTINGS, mode: "herd", crew: 1, isDragOn: false });
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

test("does have one of the staff drag him back once the crew has moved him", () => {
  let dragged = 0;

  for (let seed = 1; seed <= 12 && dragged === 0; seed += 1) {
    let run = createBackRoomRun({ ...SETTINGS, crew: 5, seed: SETTINGS.seed + seed });
    const porter = createPorter(() => run);

    while (run.outcome === null) {
      const from = run.sleeper.x;

      run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));

      if (run.sleeper.isDragged) {
        assert.ok(run.sleeper.x <= from, "a goon that has him only ever takes him back");
        dragged += from - run.sleeper.x;
      }
    }
  }

  assert.ok(dragged > 5, `dragged back ${dragged}`);
});

test("does leave him alone when the drag-back is switched off", () => {
  let run = createBackRoomRun({ ...SETTINGS, crew: 5, isDragOn: false });
  const porter = createPorter(() => run);

  while (run.outcome === null) {
    run = stepBackRoom(run, resolveBrawlCrewBotInputs(run.frame, run.block, [porter]));
    assert.equal(run.sleeper.dragger, null);
  }

  assert.equal(run.outcome, "out");
});
