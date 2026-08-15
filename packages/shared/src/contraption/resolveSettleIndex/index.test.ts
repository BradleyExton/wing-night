import assert from "node:assert/strict";
import test from "node:test";

import type { Run, Vec2 } from "../types.js";
import { SETTLE_EPSILON_UNITS, maxDisplacement, resolveSettleIndex } from "./index.js";

const runOf = (frames: readonly (readonly Vec2[])[]): Run => {
  return { keyframeHz: 30, keyframes: frames };
};

const still = { x: 0, y: 0 };

test("reports the frame after which nothing moves again", () => {
  const run = runOf([[{ x: 0, y: 0 }], [{ x: 0, y: 5 }], [{ x: 0, y: 5 }], [{ x: 0, y: 5 }]]);

  assert.equal(resolveSettleIndex(run), 1);
});

test("reports no settle when the final frame is still moving", () => {
  const run = runOf([[{ x: 0, y: 0 }], [{ x: 0, y: 5 }], [{ x: 0, y: 10 }]]);

  assert.equal(resolveSettleIndex(run), null);
});

test("reports the opening frame when nothing ever moved", () => {
  const run = runOf([[still], [still], [still]]);

  assert.equal(resolveSettleIndex(run), 0);
});

// Walking backwards is what makes this correct: a body that stalls and is then knocked loose has
// to report the LATER settle, not the earlier stall.
test("reports the later settle when a stalled body is knocked loose again", () => {
  const run = runOf([
    [{ x: 0, y: 0 }],
    [{ x: 0, y: 5 }],
    [{ x: 0, y: 5 }],
    [{ x: 0, y: 5 }],
    [{ x: 0, y: 9 }],
    [{ x: 0, y: 9 }]
  ]);

  assert.equal(resolveSettleIndex(run), 4);
});

test("ignores motion below the settle epsilon", () => {
  const drift = SETTLE_EPSILON_UNITS / 2;
  const run = runOf([[{ x: 0, y: 0 }], [{ x: 0, y: drift }], [{ x: 0, y: drift * 2 }]]);

  assert.equal(resolveSettleIndex(run), 0);
});

test("honours an explicit epsilon over the default", () => {
  const run = runOf([[{ x: 0, y: 0 }], [{ x: 0, y: 1 }], [{ x: 0, y: 2 }]]);

  assert.equal(resolveSettleIndex(run, 10), 0);
});

test("reports the largest displacement across every body in a frame", () => {
  const before: readonly Vec2[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
  const after: readonly Vec2[] = [{ x: 3, y: 4 }, { x: 1, y: 0 }];

  assert.equal(maxDisplacement(before, after), 5);
});

// The integrator emits one point per body in layout order, so a short frame means a malformed run
// rather than a settled one — skipping the missing index keeps it from reading as zero motion.
test("skips bodies missing from the earlier frame when measuring displacement", () => {
  const before: readonly Vec2[] = [{ x: 0, y: 0 }];
  const after: readonly Vec2[] = [{ x: 0, y: 0 }, { x: 100, y: 100 }];

  assert.equal(maxDisplacement(before, after), 0);
});
