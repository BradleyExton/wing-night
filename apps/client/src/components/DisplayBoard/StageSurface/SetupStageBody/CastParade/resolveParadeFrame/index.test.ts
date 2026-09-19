import assert from "node:assert/strict";
import test from "node:test";

import {
  PARADE_CYCLE_MS,
  PARADE_DANCE_MS,
  PARADE_ENTER_MS,
  PARADE_STAGED_MS,
  resolveParadeFrame
} from "./index";

test("does stage the first pair off the edge for the first frames of the night", () => {
  assert.deepEqual(resolveParadeFrame(0, 3), { pairIndex: 0, phase: "staged" });
  assert.deepEqual(resolveParadeFrame(PARADE_STAGED_MS - 1, 3), { pairIndex: 0, phase: "staged" });
});

test("does walk a pair in, dance it, and walk it out over one cycle", () => {
  assert.equal(resolveParadeFrame(PARADE_STAGED_MS, 3).phase, "enter");
  assert.equal(resolveParadeFrame(PARADE_ENTER_MS - 1, 3).phase, "enter");
  assert.equal(resolveParadeFrame(PARADE_ENTER_MS, 3).phase, "dance");
  assert.equal(resolveParadeFrame(PARADE_ENTER_MS + PARADE_DANCE_MS - 1, 3).phase, "dance");
  assert.equal(resolveParadeFrame(PARADE_ENTER_MS + PARADE_DANCE_MS, 3).phase, "exit");
  assert.equal(resolveParadeFrame(PARADE_CYCLE_MS - 1, 3).phase, "exit");
});

test("does bring the next pair on once a cycle and wrap back to the first", () => {
  assert.deepEqual(resolveParadeFrame(PARADE_CYCLE_MS, 3), { pairIndex: 1, phase: "staged" });
  assert.equal(resolveParadeFrame(PARADE_CYCLE_MS * 2 + PARADE_ENTER_MS, 3).pairIndex, 2);
  assert.equal(resolveParadeFrame(PARADE_CYCLE_MS * 3 + PARADE_ENTER_MS, 3).pairIndex, 0);
});

test("does keep one pair cycling when it is the only pair", () => {
  assert.equal(resolveParadeFrame(PARADE_CYCLE_MS * 5 + PARADE_ENTER_MS, 1).pairIndex, 0);
  assert.equal(resolveParadeFrame(PARADE_CYCLE_MS * 5 + PARADE_ENTER_MS, 1).phase, "dance");
});

test("does hold a staged first pair when there are no pairs at all", () => {
  assert.deepEqual(resolveParadeFrame(99999, 0), { pairIndex: 0, phase: "staged" });
});
