import assert from "node:assert/strict";
import test from "node:test";

import { BENCH_WALK_SPEED, isBenchParked, stepBenchWalk } from "./index.js";

const at = (entries: [string, number][]): Map<string, number> => new Map(entries);

test("does walk toward the mark by a frame's stride when it is further than a stride away", () => {
  const next = stepBenchWalk(at([["alex", 32]]), [{ id: "alex", x: 8 }], 100);

  assert.equal(next.get("alex"), 32 - BENCH_WALK_SPEED * 0.1);
});

test("does walk the other way when the mark is to the right", () => {
  const next = stepBenchWalk(at([["dan", 8]]), [{ id: "dan", x: 15 }], 250, 8);

  assert.equal(next.get("dan"), 10);
});

test("does park on the mark when it is within a stride", () => {
  const next = stepBenchWalk(at([["caitlin", 20.5]]), [{ id: "caitlin", x: 22 }], 1000);

  assert.equal(next.get("caitlin"), 22);
  assert.equal(isBenchParked(next, [{ id: "caitlin", x: 22 }]), true);
});

test("does stand a newcomer straight on their mark rather than walking them in", () => {
  const next = stepBenchWalk(at([]), [{ id: "rob", x: 13 }], 16);

  assert.equal(next.get("rob"), 13);
});

test("does forget a bird no longer on the bench", () => {
  const next = stepBenchWalk(at([["alex", 32], ["gone", 4]]), [{ id: "alex", x: 32 }], 16);

  assert.equal(next.has("gone"), false);
});

test("does not move a bird already on its mark", () => {
  const next = stepBenchWalk(at([["alex", 32]]), [{ id: "alex", x: 32 }], 16);

  assert.equal(next.get("alex"), 32);
  assert.equal(isBenchParked(next, [{ id: "alex", x: 32 }]), true);
});

test("does report the bench still walking while anyone is short of their mark", () => {
  const positions = at([["alex", 30], ["caitlin", 22]]);
  const targets = [
    { id: "alex", x: 8 },
    { id: "caitlin", x: 22 }
  ];

  assert.equal(isBenchParked(positions, targets), false);
});
