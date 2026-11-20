import assert from "node:assert/strict";
import test from "node:test";

import { resolveBayBeat, resolveClearedBeat, resolveTimeoutBeat, smooth } from "./index.js";

const up = { slot: 0, state: "up", facing: -1 } as const;
const down = { slot: 0, state: "down", facing: -1 } as const;
const away = { slot: 1, state: "away", facing: 1 } as const;

test("does ease a share at both ends and hold it inside nought and one", () => {
  assert.equal(smooth(0), 0);
  assert.equal(smooth(1), 1);
  assert.equal(smooth(0.5), 0.5);
  assert.equal(smooth(-2), 0);
  assert.equal(smooth(3), 1);
});

test("does walk a hen who is up over the line, hop her on the spot and land her at the end", () => {
  assert.deepEqual(resolveClearedBeat(up, 0), { pose: "walk", facing: 1, dx: 0, lift: 0, tilt: 0, opacity: 1 });

  const hopping = resolveClearedBeat(up, 0.55);

  assert.equal(hopping.pose, "idle");
  assert.ok(hopping.dx > 10);
  assert.ok(hopping.lift > 0);
  assert.equal(resolveClearedBeat(up, 1).lift, 0);
});

test("does start each slot's cheer a little after the one before", () => {
  assert.ok(resolveClearedBeat({ ...up, slot: 3 }, 0.2).dx < resolveClearedBeat(up, 0.2).dx);
});

test("does leave a downed hen lying and a sat-out hen sitting through a clear and a bell", () => {
  assert.deepEqual(resolveClearedBeat(down, 0.5), { pose: "ko", facing: -1, dx: 0, lift: 0, tilt: 0, opacity: 1 });
  assert.equal(resolveClearedBeat(away, 0.5).pose, "still");
  assert.equal(resolveClearedBeat(away, 0.5).opacity, 0.4);
  assert.equal(resolveTimeoutBeat(down, 0.5).pose, "ko");
});

test("does bring two geese in on each downed hen, carry her off the top and splash at the end", () => {
  const before = resolveBayBeat(down, 0.1);

  assert.equal(before.geese.length, 2);
  assert.equal(before.hen.lift, 0);
  assert.equal(before.splash, null);
  assert.ok((before.geese[0]?.y ?? 0) > 30, "still swooping in from above");

  const carried = resolveBayBeat(down, 0.5);

  assert.ok(carried.hen.lift > 20);
  assert.ok(Math.abs((carried.geese[0]?.x ?? 0) + 8) < 0.01, "holding on at her side");

  const landed = resolveBayBeat(down, 1);

  assert.ok(landed.hen.lift >= 150);
  assert.equal(landed.splash, 1);
});

test("does take the crew one after another and leave a sat-out hen where she sits", () => {
  assert.ok(resolveBayBeat({ ...down, slot: 4 }, 0.5).hen.lift < resolveBayBeat(down, 0.5).hen.lift);
  assert.deepEqual(resolveBayBeat(away, 0.5).geese, []);
  assert.equal(resolveBayBeat(away, 0.5).hen.pose, "still");
});

test("does slump every hen still up toward the way she faces when the bell rings", () => {
  assert.equal(resolveTimeoutBeat(up, 0).tilt, 0);
  assert.equal(resolveTimeoutBeat(up, 1).tilt, -14);
  assert.equal(resolveTimeoutBeat({ ...up, facing: 1 }, 1).tilt, 14);
  assert.equal(resolveTimeoutBeat(up, 1).pose, "hurt");
});
