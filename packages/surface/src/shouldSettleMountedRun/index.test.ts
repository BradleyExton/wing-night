import assert from "node:assert/strict";
import test from "node:test";

import { shouldSettleMountedRun } from "./index.js";

const mountedMidRun = { isRunLive: true, hasLocalClock: false, hasEnded: false };

test("does settle a live run it found with no clock of its own when the seat can act", () => {
  // The reload: the tablet comes back on a flight nobody is flying and hands the server its log.
  assert.equal(shouldSettleMountedRun({ ...mountedMidRun, canAct: true }), true);
});

test("does never settle a run it mounted into when the seat cannot act", () => {
  // A take-back, a reconnect or a watching device: someone else's run, not this screen's to end.
  assert.equal(shouldSettleMountedRun({ ...mountedMidRun, canAct: false }), false);
});

test("does leave a run alone when this screen's own finger started its clock", () => {
  assert.equal(shouldSettleMountedRun({ ...mountedMidRun, hasLocalClock: true, canAct: true }), false);
});

test("does report a run ended only once", () => {
  assert.equal(shouldSettleMountedRun({ ...mountedMidRun, hasEnded: true, canAct: true }), false);
});

test("does leave a run that is not under way alone", () => {
  assert.equal(shouldSettleMountedRun({ ...mountedMidRun, isRunLive: false, canAct: true }), false);
});
