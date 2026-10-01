import assert from "node:assert/strict";
import test from "node:test";

import { HANDOFF_GAP, resolveClearedBeat, resolveKoBeat, resolveTimeoutBeat, smooth } from "./index.js";

test("does ease a share at both ends and hold it inside nought and one", () => {
  assert.equal(smooth(0), 0);
  assert.equal(smooth(1), 1);
  assert.equal(smooth(0.5), 0.5);
  assert.equal(smooth(-2), 0);
  assert.equal(smooth(3), 1);
});

test("does walk the hen up to the waiting teammate, peck beak to beak, and turn them to the street", () => {
  const mateX = 470;

  assert.deepEqual(resolveClearedBeat(450, mateX, 0), { henX: 450, facing: 1, pose: "walk", mateFacing: -1 });
  assert.equal(resolveClearedBeat(450, mateX, 0.5).pose, "peck");
  assert.equal(resolveClearedBeat(450, mateX, 0.5).henX, mateX - HANDOFF_GAP);

  const end = resolveClearedBeat(450, mateX, 1);

  assert.equal(end.mateFacing, 1);
  assert.equal(end.facing, -1);
  assert.equal(end.pose, "idle");
});

test("does let the hen step over the line and bow when nobody is waiting", () => {
  const end = resolveClearedBeat(450, null, 1);

  assert.equal(end.henX, 456);
  assert.equal(end.facing, 1);
});

test("does swoop the geese in, lift the hen off the top of the frame, then splash", () => {
  const start = resolveKoBeat(100, 0);
  const grabbed = resolveKoBeat(100, 0.25);
  const gone = resolveKoBeat(100, 0.72);
  const end = resolveKoBeat(100, 1);

  assert.equal(start.henLift, 0);
  assert.ok(start.geese.every((goose) => goose.y > 90));
  assert.equal(grabbed.henLift, 0);
  assert.ok(grabbed.geese.every((goose) => goose.y < 30 && Math.abs(goose.x - 100) < 10));
  assert.ok(gone.henLift > 90);
  assert.equal(gone.splash, 0);
  assert.equal(start.splash, null);
  assert.equal(end.splash, 1);
});

test("does slump the hen forward over her feet while the bell rings", () => {
  assert.equal(resolveTimeoutBeat(1, 0).tilt, 0);
  assert.equal(resolveTimeoutBeat(1, 1).tilt, 14);
  assert.equal(resolveTimeoutBeat(-1, 1).tilt, -14);
  assert.equal(resolveTimeoutBeat(1, 0.5).pose, "hurt");
});
