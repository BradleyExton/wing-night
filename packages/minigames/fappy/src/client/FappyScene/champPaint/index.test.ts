import assert from "node:assert/strict";
import test from "node:test";

import { FAPPY_WORLD, resolveFappyGates } from "@wingnight/shared";

import { CHAMP_LOOKS, SPIT_SNAP_TICKS, SPIT_WINDUP_TICKS, resolveChampPaint, resolveMouthOpen, resolveWakeWobble } from "./index.js";

const [gate] = resolveFappyGates({ seed: 7, legIndex: 0, gatesPerLeg: 1 });
const spitter = { ...gate!, champBob: 0, spitPeriodTicks: 150, spitPhaseTicks: 0 };
const mute = { ...gate!, champBob: 0, spitPeriodTicks: 0, spitPhaseTicks: 0 };

test("does keep the top of every kind's head on the sim's champTop, whatever its build", () => {
  for (const champKind of ["pink", "ebony", "ivory"] as const) {
    const kind = { ...mute, champKind };
    const paint = resolveChampPaint(kind, 17, null);
    const headY = Number(paint.faceTransform.match(/translate\([-\d.]+ ([-\d.]+)\)/)?.[1]);

    assert.equal(paint.top, kind.champTop);
    assert.ok(Math.abs(headY - (kind.champTop + CHAMP_LOOKS[champKind].headRadius)) < 1e-6, paint.faceTransform);
    // The drawn head stays inside the gate's column, which is the hitbox.
    assert.ok(CHAMP_LOOKS[champKind].headRadius <= FAPPY_WORLD.gateWidth / 2);
  }
});

test("does open a spitter's mouth through the windup and snap it shut after the glob", () => {
  const beat = spitter.spitPeriodTicks;

  assert.equal(resolveMouthOpen(spitter, beat / 2), 0);
  assert.equal(resolveMouthOpen(spitter, beat - SPIT_WINDUP_TICKS), 0);
  assert.ok(resolveMouthOpen(spitter, beat - SPIT_WINDUP_TICKS / 2) > 0);
  assert.ok(resolveMouthOpen(spitter, beat - 1) > resolveMouthOpen(spitter, beat - SPIT_WINDUP_TICKS / 2));
  assert.equal(resolveMouthOpen(spitter, beat), 1);
  assert.equal(resolveMouthOpen(spitter, beat + SPIT_SNAP_TICKS), 0);
  assert.equal(resolveMouthOpen(mute, beat - 1), 0);

  const gaping = resolveChampPaint(spitter, beat - 1, null);
  const shut = resolveChampPaint(spitter, beat / 2, null);

  assert.equal(gaping.spit, null, "nothing in the air until the beat");
  assert.notEqual(resolveChampPaint(spitter, beat, null).spit, null);
  assert.match(gaping.lidTransform, /^rotate\((?!0 )/);
  assert.match(shut.lidTransform, /^rotate\(0 /);
  assert.equal(resolveChampPaint(mute, beat, null).spit, null);
});

test("does whip only in the wake of a bird that has just passed, and settle again", () => {
  const look = CHAMP_LOOKS.pink;
  const passX = gate!.x + FAPPY_WORLD.gateWidth + FAPPY_WORLD.birdRadius;
  const ahead = { x: passX - 20, y: 50 };
  const justPast = { x: passX + FAPPY_WORLD.scrollSpeed * 3, y: 50 };
  const longGone = { x: passX + FAPPY_WORLD.scrollSpeed * 400, y: 50 };

  assert.equal(resolveWakeWobble(gate!, look, null), 0);
  assert.equal(resolveWakeWobble(gate!, look, ahead), 0);
  assert.notEqual(resolveWakeWobble(gate!, look, justPast), 0);
  assert.equal(resolveWakeWobble(gate!, look, longGone), 0);
  assert.notEqual(resolveChampPaint(gate!, 3, justPast).ballsTransform, resolveChampPaint(gate!, 3, ahead).ballsTransform);
});
