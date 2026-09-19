import assert from "node:assert/strict";
import test from "node:test";

import type { JoustShotRun } from "../types.js";
import {
  JOUST_SHOOTER_BODY_COUNT,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_TOPPLE_TILT,
  JOUST_TOWER_TOPPLE_TILT,
  JOUST_WORLD,
  joustLegFootIndex,
  joustLegTopIndex,
  joustPinFootIndex,
  joustPinHeadIndex,
  readJoustFramePosition,
  resolveJoustLeanTilt,
  resolveJoustLegs,
  resolveJoustPinTilt,
  resolveJoustRackSlots
} from "../world/index.js";
import { simulateJoustShot } from "./index.js";

const PERCHES = [
  { x: 54, y: 78, width: 102 },
  { x: 116, y: 50, width: 34 }
];
const RACK = resolveJoustRackSlots(PERCHES, 10);
const OPEN_ARENA = { pinFeet: RACK, perches: PERCHES, obstacles: [] };
const CACTUS_ARENA = {
  pinFeet: RACK,
  perches: PERCHES,
  // A wall standing in front of the whole rack, so nothing behind it is reachable.
  obstacles: [{ x: 48, y: 36, width: 5, height: 42 }]
};

/** Up on the shelf rather than down on the sand. */
const isRaised = (pinIndex: number): boolean =>
  (RACK[pinIndex]?.y ?? JOUST_WORLD.floorY) < JOUST_WORLD.floorY - 10;
const OPTIONS = { seed: 7, maxDurationSeconds: 4.5, stepHz: 240, keyframeHz: 24 };

const LEGS = resolveJoustLegs(PERCHES);

const bodyCount = (pinCount: number, legCount = LEGS.length): number =>
  JOUST_SHOOTER_BODY_COUNT + pinCount * 2 + legCount * 2;

const lastFrame = (run: JoustShotRun): readonly number[] => {
  const frame = run.keyframes[run.keyframes.length - 1];
  assert.ok(frame !== undefined);
  return frame;
};

test("produces a byte-identical track for the same lane, aim and seed", () => {
  const first = simulateJoustShot(CACTUS_ARENA, { x: -0.8, y: 0.5 }, OPTIONS);
  const second = simulateJoustShot(CACTUS_ARENA, { x: -0.8, y: 0.5 }, OPTIONS);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("samples every body into every frame", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0.5 }, OPTIONS);

  assert.equal(run.keyframeHz, OPTIONS.keyframeHz);
  assert.ok(run.keyframes.length > 1);
  for (const frame of run.keyframes) {
    assert.equal(frame.length, bodyCount(RACK.length) * 2);
  }
});

test("still runs when the rack has already been cleared", () => {
  const run = simulateJoustShot(
    { pinFeet: [], perches: PERCHES, obstacles: [] },
    { x: -1, y: 0 },
    OPTIONS
  );

  assert.deepEqual(run.topples, []);
  for (const frame of run.keyframes) {
    assert.equal(frame.length, bodyCount(0) * 2);
  }
});

test("leaves the rack standing when nobody is shot at", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.02, y: 0 }, OPTIONS);

  assert.deepEqual(run.topples, []);
  for (let pinIndex = 0; pinIndex < RACK.length; pinIndex += 1) {
    const foot = readJoustFramePosition(lastFrame(run), joustPinFootIndex(pinIndex));
    const head = readJoustFramePosition(lastFrame(run), joustPinHeadIndex(pinIndex));

    assert.ok(resolveJoustPinTilt(foot, head) <= JOUST_TOPPLE_TILT, `pin ${pinIndex} fell over`);
  }
});

test("takes more than one player down in a single shot", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0 }, OPTIONS);
  const toppled = run.topples.map((topple) => topple.pinIndex);

  assert.ok(toppled.length > 1, `expected a pile-up, got ${toppled.join(",")}`);
});

// The whole point of standing players up on scaffolding: a flat shot cannot reach the shelf, and
// nothing but an arc gets up there — unless it brings the shelf DOWN, which is the other way up.
// Lose this and every lane is a flat rack again.
test("keeps a flat shot down on the sand unless it fells the tower itself", () => {
  for (const pull of [-1, -0.85, -0.7]) {
    const run = simulateJoustShot(OPEN_ARENA, { x: pull, y: 0 }, OPTIONS);

    if (run.collapses.length > 0) {
      continue;
    }

    for (const topple of run.topples) {
      assert.ok(
        !isRaised(topple.pinIndex),
        `a flat shot at ${pull} reached the shelf (pin ${topple.pinIndex})`
      );
    }
  }
});

const legTilt = (frame: readonly number[], legIndex: number): number => {
  const leg = LEGS[legIndex];

  assert.ok(leg !== undefined);
  return resolveJoustLeanTilt(
    readJoustFramePosition(frame, joustLegFootIndex(RACK.length, legIndex)),
    readJoustFramePosition(frame, joustLegTopIndex(RACK.length, legIndex)),
    leg.footY - leg.topY
  );
};

test("does build a foot and a top body for every leg of every standing tower", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.5, y: 0.2 }, OPTIONS);

  assert.equal(LEGS.length, 2, "one built shelf, two legs");
  assert.equal(lastFrame(run).length, bodyCount(RACK.length) * 2);
});

test("does stand a tower up on its own legs without a shot to hold it there", () => {
  const twitch = simulateJoustShot(OPEN_ARENA, { x: -0.02, y: 0 }, OPTIONS);

  assert.deepEqual(twitch.collapses, []);
  for (let legIndex = 0; legIndex < LEGS.length; legIndex += 1) {
    assert.ok(legTilt(lastFrame(twitch), legIndex) < 0.02, `leg ${legIndex} leaned on its own`);
  }
});

// Found by sweeping the aim space: a full-power shot just above flat ploughs the sand row and
// carries on into the tower's near leg with enough left to fold it.
const TIMBER_AIM = { x: -1, y: 0.15 };

test("does fold a tower under a hard low shot and drop everyone stood on it", () => {
  const run = simulateJoustShot(OPEN_ARENA, TIMBER_AIM, OPTIONS);
  const collapse = run.collapses[0];

  assert.ok(collapse !== undefined, "expected the tower to come down");
  assert.equal(collapse.perchIndex, 1);
  assert.ok(collapse.frameIndex > 0 && collapse.frameIndex < run.keyframes.length);

  const raised = RACK.flatMap((_foot, pinIndex) => (isRaised(pinIndex) ? [pinIndex] : []));
  const toppledRaised = run.topples.filter((topple) => isRaised(topple.pinIndex));

  assert.deepEqual(
    toppledRaised.map((topple) => topple.pinIndex).sort(),
    raised.sort(),
    "everyone on the shelf goes down with it"
  );
  for (const topple of toppledRaised) {
    assert.equal(topple.frameIndex, collapse.frameIndex, "and is counted the frame it fell");
  }
  for (let legIndex = 0; legIndex < LEGS.length; legIndex += 1) {
    assert.ok(
      legTilt(lastFrame(run), legIndex) > JOUST_TOWER_TOPPLE_TILT,
      `leg ${legIndex} should end up folded`
    );
  }
});

// They land in a heap on the fallen timber, the shot and each other rather than flat on the
// sand — which is the pile the room wants to see — but nobody is left hanging where the shelf was.
test("does drop a felled shelf's players well below where they stood", () => {
  const run = simulateJoustShot(OPEN_ARENA, TIMBER_AIM, OPTIONS);

  for (let pinIndex = 0; pinIndex < RACK.length; pinIndex += 1) {
    const home = RACK[pinIndex];

    if (home === undefined || !isRaised(pinIndex)) {
      continue;
    }

    const foot = readJoustFramePosition(lastFrame(run), joustPinFootIndex(pinIndex));

    assert.ok(foot.y > home.y + 8, `pin ${pinIndex} is still up at ${foot.y} (shelf ${home.y})`);
  }
});

test("does not fold a tower under a lob that lands on top of it", () => {
  const lob = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0.7 }, OPTIONS);

  assert.deepEqual(lob.collapses, []);
});

test("does build nothing for a tower already in rubble", () => {
  const run = simulateJoustShot(
    { ...OPEN_ARENA, collapsedPerchIndices: [1] },
    TIMBER_AIM,
    OPTIONS
  );

  assert.deepEqual(run.collapses, []);
  assert.equal(lastFrame(run).length, bodyCount(RACK.length, 0) * 2);
});

test("does fold the same tower once, on a frame the replay actually has", () => {
  const run = simulateJoustShot(OPEN_ARENA, TIMBER_AIM, OPTIONS);
  const perchIndices = run.collapses.map((collapse) => collapse.perchIndex);

  assert.equal(new Set(perchIndices).size, perchIndices.length);
  for (const collapse of run.collapses) {
    assert.ok(collapse.frameIndex >= 0 && collapse.frameIndex < run.keyframes.length);
  }
});

test("drops a lob on the players up on the shelf", () => {
  const lob = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0.7 }, OPTIONS);
  const toppled = lob.topples.map((topple) => topple.pinIndex);

  assert.ok(toppled.length > 0, "a lob should reach something");
  assert.ok(
    toppled.some(isRaised),
    `a lob should reach the shelf, hit ${toppled.join(",")}`
  );
});

test("stands the rack up on its own without a shot to hold it there", () => {
  const twitch = simulateJoustShot(OPEN_ARENA, { x: -0.02, y: 0 }, OPTIONS);

  assert.deepEqual(twitch.topples, [], "a rack that falls over by itself is not a rack");
});

test("names every toppled pin once, on a frame the replay actually has", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, OPTIONS);
  const pinIndices = run.topples.map((topple) => topple.pinIndex);

  assert.equal(new Set(pinIndices).size, pinIndices.length);
  for (const topple of run.topples) {
    assert.ok(topple.pinIndex >= 0 && topple.pinIndex < RACK.length);
    assert.ok(topple.frameIndex >= 0 && topple.frameIndex < run.keyframes.length);
  }
});

test("reports a miss when the band is barely drawn", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.05, y: 0 }, OPTIONS);
  const head = readJoustFramePosition(lastFrame(run), JOUST_SHOOTER_HEAD_INDEX);
  const frontPin = RACK[0]?.x ?? 0;

  assert.deepEqual(run.topples, []);
  assert.ok(head.x < frontPin - 10, "a slack shot should drop near the slingshot");
});

test("stops the shooter at the cactus instead of passing through it", () => {
  const run = simulateJoustShot(CACTUS_ARENA, { x: -1, y: 0 }, OPTIONS);
  const head = readJoustFramePosition(lastFrame(run), JOUST_SHOOTER_HEAD_INDEX);

  assert.deepEqual(run.topples, []);
  assert.ok(head.x < 48, `head should stay left of the cactus face, was ${head.x}`);
});

test("never lets a body fall through the floor", () => {
  const run = simulateJoustShot(CACTUS_ARENA, { x: -0.6, y: 0.7 }, OPTIONS);

  for (const frame of run.keyframes) {
    for (let index = 0; index < bodyCount(RACK.length); index += 1) {
      assert.ok(readJoustFramePosition(frame, index).y <= JOUST_WORLD.floorY + 0.01);
    }
  }
});

test("cuts the track once the scene has settled, before the duration cap", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.05, y: 0 }, OPTIONS);

  assert.ok(run.keyframes.length < OPTIONS.maxDurationSeconds * OPTIONS.keyframeHz);
  assert.ok(run.keyframes.length >= OPTIONS.keyframeHz, "but never shorter than a second");
});

test("respects the duration cap when nothing ever settles", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -1, y: 0.7 }, {
    ...OPTIONS,
    maxDurationSeconds: 0.5
  });

  assert.ok(run.keyframes.length <= 0.5 * OPTIONS.keyframeHz + 1);
});

test("rejects options the replay could not honour", () => {
  assert.throws(
    () => simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, { ...OPTIONS, keyframeHz: 7 }),
    RangeError
  );
  assert.throws(
    () => simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, { ...OPTIONS, seed: Number.NaN }),
    RangeError
  );
  assert.throws(
    () => simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, { ...OPTIONS, maxDurationSeconds: 0 }),
    RangeError
  );
});
