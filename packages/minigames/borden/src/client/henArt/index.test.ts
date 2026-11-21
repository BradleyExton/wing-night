import assert from "node:assert/strict";
import test from "node:test";

import { BORDEN_WORLD, createBordenStart, resolveBordenStretch, type BordenHen, type BordenStick } from "@wingnight/shared";

import { resolveBordenHenArt, resolveBordenSprayAngle } from "./index.js";

const hen = (overrides: Partial<BordenHen> = {}): BordenHen => {
  const start = createBordenStart(resolveBordenStretch({ seed: 1, stretch: 0, pair: 1 }));

  return { ...(start.hens[0] as BordenHen), ...overrides };
};

test("does aim the stream the way the stick points when she is standing or in the air", () => {
  const angles = ([0, 1, 5, 7, 6, 8] as BordenStick[]).map((stick) => resolveBordenSprayAngle(hen({ stick })));

  assert.deepEqual(angles, [0, 0, 0, -90, -45, -45]);
  assert.equal(resolveBordenSprayAngle(hen({ stick: 3, y: 10, vy: 1 })), 90);
  assert.equal(resolveBordenSprayAngle(hen({ stick: 2, y: 10, vy: 1 })), 45);
});

test("does spray straight ahead along the floor when she is ducked", () => {
  for (const stick of [2, 3, 4] as BordenStick[]) {
    assert.equal(resolveBordenSprayAngle(hen({ stick })), 0);
    assert.equal(resolveBordenHenArt(hen({ stick }), 0).pose, "duck");
  }
});

test("does pick the pose from her state, the hit, the jump and the stick in that order", () => {
  assert.deepEqual(resolveBordenHenArt(hen({ state: "down" }), 0), { pose: "ko", spray: null });
  assert.deepEqual(resolveBordenHenArt(hen({ state: "away" }), 0), { pose: "still", spray: null });
  assert.equal(resolveBordenHenArt(hen({ hurtUntilTick: 10, y: 5, vy: 1 }), 5).pose, "hurt");
  assert.equal(resolveBordenHenArt(hen({ y: 5, vy: BORDEN_WORLD.jumpSpeed }), 5).pose, "fly");
  assert.equal(resolveBordenHenArt(hen({ stick: 1 }), 0).pose, "walk");
  assert.equal(resolveBordenHenArt(hen({ stick: 0 }), 0).pose, "idle");
});

test("does spray hot sauce when she carries a hot bottle", () => {
  assert.equal(resolveBordenHenArt(hen({ bottle: "mild" }), 0).spray?.tone, "mild");
  assert.equal(resolveBordenHenArt(hen({ bottle: "spread" }), 0).spray?.tone, "hot");
});
