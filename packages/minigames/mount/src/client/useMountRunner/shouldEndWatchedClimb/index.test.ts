import assert from "node:assert/strict";
import test from "node:test";

import { shouldEndWatchedClimb } from "./index.js";

const watched = { status: "running" as const, localRun: { startedAtMs: null, hasEnded: false } };

test("does never end a climb someone else is on when the screen cannot act", () => {
  assert.equal(shouldEndWatchedClimb({ ...watched, canAct: false }), false);
});

test("does hand the server a live climb it found with no clock of its own when the screen can act", () => {
  assert.equal(shouldEndWatchedClimb({ ...watched, canAct: true }), true);
});

test("does leave a climb alone when this screen is climbing it or already ended it", () => {
  assert.equal(shouldEndWatchedClimb({ status: "running", localRun: { startedAtMs: 10, hasEnded: false }, canAct: true }), false);
  assert.equal(shouldEndWatchedClimb({ status: "running", localRun: { startedAtMs: null, hasEnded: true }, canAct: true }), false);
  assert.equal(shouldEndWatchedClimb({ status: "ready", localRun: { startedAtMs: null, hasEnded: false }, canAct: true }), false);
  assert.equal(shouldEndWatchedClimb({ status: "running", localRun: null, canAct: true }), false);
});
