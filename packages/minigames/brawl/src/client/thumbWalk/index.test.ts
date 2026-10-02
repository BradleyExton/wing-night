import assert from "node:assert/strict";
import test from "node:test";

import { THUMB_WALK_IDLE, TURN_PX, resolveThumbWalk, type ThumbWalkEvent, type ThumbWalkState } from "./index.js";

const run = (events: ThumbWalkEvent[], from: ThumbWalkState = THUMB_WALK_IDLE): ThumbWalkState => {
  return events.reduce(resolveThumbWalk, from);
};

test("does walk the way the hen faces when a thumb lands anywhere on the pad", () => {
  assert.deepEqual(run([{ kind: "down", pointerId: 1, x: 200, facing: 1 }]), { pointerId: 1, centreX: 200, dir: 1 });
  assert.equal(run([{ kind: "down", pointerId: 1, x: 40, facing: -1 }]).dir, -1);
});

test("does keep walking the same way when the thumb wobbles inside the dead band", () => {
  const held = run([
    { kind: "down", pointerId: 1, x: 200, facing: 1 },
    { kind: "move", pointerId: 1, x: 200 - TURN_PX },
    { kind: "move", pointerId: 1, x: 190 }
  ]);

  assert.equal(held.dir, 1);
  assert.equal(held.centreX, 200);
});

test("does turn the hen when the thumb pulls back past the dead band", () => {
  const turned = run([
    { kind: "down", pointerId: 1, x: 200, facing: 1 },
    { kind: "move", pointerId: 1, x: 200 - TURN_PX - 1 }
  ]);

  assert.equal(turned.dir, -1);
  assert.equal(turned.centreX, 200 - TURN_PX - 1);
});

test("does re-centre on a turn so a second pull back turns her again without a long travel", () => {
  const twice = run([
    { kind: "down", pointerId: 1, x: 200, facing: 1 },
    { kind: "move", pointerId: 1, x: 160 },
    { kind: "move", pointerId: 1, x: 160 + TURN_PX + 1 }
  ]);

  assert.equal(twice.dir, 1);
  assert.equal(twice.centreX, 160 + TURN_PX + 1);
});

test("does trail the centre forward so a pull back is measured from where the thumb has got to", () => {
  const rolled = run([
    { kind: "down", pointerId: 1, x: 200, facing: 1 },
    { kind: "move", pointerId: 1, x: 260 },
    { kind: "move", pointerId: 1, x: 260 - TURN_PX - 1 }
  ]);

  assert.equal(rolled.dir, -1);
});

test("does stop the hen when the owning thumb lifts or is cancelled", () => {
  const held = run([{ kind: "down", pointerId: 1, x: 200, facing: 1 }]);

  assert.deepEqual(resolveThumbWalk(held, { kind: "up", pointerId: 1 }), THUMB_WALK_IDLE);
});

test("does ignore a second thumb on a pad another one owns", () => {
  const held = run([{ kind: "down", pointerId: 1, x: 200, facing: 1 }]);

  assert.equal(resolveThumbWalk(held, { kind: "down", pointerId: 2, x: 20, facing: -1 }), held);
  assert.equal(resolveThumbWalk(held, { kind: "move", pointerId: 2, x: 20 }), held);
  assert.equal(resolveThumbWalk(held, { kind: "up", pointerId: 2 }), held);
});
