import assert from "node:assert/strict";
import test from "node:test";

import { createMulberry32, createXorshift32, pickInteger } from "./index.js";

const take = (random: () => number, count: number): number[] => {
  return Array.from({ length: count }, () => random());
};

test("createXorshift32 replays the same stream for the same seed", () => {
  assert.deepEqual(take(createXorshift32(7), 8), take(createXorshift32(7), 8));
});

test("createXorshift32 gives different seeds different streams", () => {
  assert.notDeepEqual(take(createXorshift32(7), 8), take(createXorshift32(8), 8));
});

test("createXorshift32 does not stall on a zero seed", () => {
  // xorshift32 is absorbing at zero; without the substituted state every draw
  // from a zero-seeded stream would be the same number.
  const draws = take(createXorshift32(0), 8);

  assert.equal(new Set(draws).size, 8);
});

test("createMulberry32 replays the same stream for the same seed", () => {
  assert.deepEqual(take(createMulberry32(7), 8), take(createMulberry32(7), 8));
});

test("createMulberry32 gives different seeds different streams", () => {
  assert.notDeepEqual(take(createMulberry32(7), 8), take(createMulberry32(8), 8));
});

test("both generators stay inside the unit interval", () => {
  for (const random of [createXorshift32(11), createMulberry32(11), createXorshift32(0)]) {
    for (const draw of take(random, 64)) {
      assert.equal(draw >= 0 && draw < 1, true, `draw out of range: ${draw}`);
    }
  }
});

test("pickInteger spans the range inclusively", () => {
  const random = createMulberry32(3);
  const picks = new Set(Array.from({ length: 200 }, () => pickInteger(random, 1, 3)));

  assert.deepEqual([...picks].sort(), [1, 2, 3]);
});

test("pickInteger returns the only value when min equals max", () => {
  assert.equal(pickInteger(createMulberry32(3), 5, 5), 5);
});
