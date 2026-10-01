import assert from "node:assert/strict";
import test from "node:test";
import { BRAWL_WORLD, createBrawlRunStart, resolveBrawlBlock } from "@wingnight/shared";

import { HEN_SCALE, isHenPecking, resolveHenOpacity, resolveHenPose, resolveHenTransform } from "./index.js";

const start = createBrawlRunStart(resolveBrawlBlock({ seed: 20261001, blocks: 2, block: 0 }));

test("does stand the hen idle on the line when nothing is held", () => {
  assert.equal(resolveHenPose(start), "idle");
  assert.equal(isHenPecking(start), false);
});

test("does walk the hen when the thumb is down and she is not reeling", () => {
  assert.equal(resolveHenPose({ ...start, walking: 1 }), "walk");
  assert.equal(resolveHenPose({ ...start, walking: -1 }), "walk");
});

test("does peck from the press until the peck's box closes, whatever the thumb is doing", () => {
  const pecking = { ...start, tick: 10, walking: 1 as const, peckUntilTick: 24 };

  assert.equal(resolveHenPose(pecking), "peck");
  assert.equal(isHenPecking(pecking), true);
  assert.equal(resolveHenPose({ ...pecking, tick: 24 }), "walk");
});

test("does reel the hen when she is hurt, over a peck and a walk alike", () => {
  assert.equal(resolveHenPose({ ...start, tick: 10, walking: 1, peckUntilTick: 20, hurtUntilTick: 12 }), "hurt");
});

test("does flicker the hen through the mercy window after a hit and hold her solid otherwise", () => {
  assert.equal(resolveHenOpacity(start), 1);

  const hit = { ...start, hits: [100], invulnerableUntilTick: 100 + BRAWL_WORLD.invulnerableTicks };
  const seen = new Set<number>();

  for (let tick = 100; tick < hit.invulnerableUntilTick; tick += 1) {
    seen.add(resolveHenOpacity({ ...hit, tick }));
  }

  assert.deepEqual([...seen].sort(), [0.3, 1]);
  assert.equal(resolveHenOpacity({ ...hit, tick: hit.invulnerableUntilTick }), 1);
});

test("does stand the hen with her foot on the ground line and flip her to her facing", () => {
  assert.equal(
    resolveHenTransform({ x: 30, facing: 1 }),
    `translate(30 ${BRAWL_WORLD.groundY}) scale(${HEN_SCALE} ${HEN_SCALE})`
  );
  assert.match(resolveHenTransform({ x: 30, facing: -1, lift: 10, tilt: 12 }), /translate\(30 60\) rotate\(12\) scale\(-/);
});
