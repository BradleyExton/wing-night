import assert from "node:assert/strict";
import test from "node:test";
import { BRAWL_CREW_WORLD, createBrawlCrewStart, resolveBrawlCrewBlock, type BrawlCrewHen } from "@wingnight/shared";

import { HEN_SCALE, resolveHenBodyTransform, resolveHenOpacity, resolveHenPose, resolveReviveShare } from "./index.js";

const start = createBrawlCrewStart(resolveBrawlCrewBlock({ seed: 20261001, blocks: 2, block: 0, crew: 2 }));
const hen = (overrides: Partial<BrawlCrewHen> = {}): BrawlCrewHen => ({ ...(start.hens[0] as BrawlCrewHen), ...overrides });

test("does stand a hen idle on the line and walk her while the stick is held", () => {
  assert.equal(resolveHenPose(hen(), 0), "idle");
  assert.equal(resolveHenPose(hen({ walk: 3 }), 0), "walk");
});

test("does peck from the press until the peck's box closes, whatever the stick is doing", () => {
  assert.equal(resolveHenPose(hen({ walk: 1, peckUntilTick: 24 }), 10), "peck");
  assert.equal(resolveHenPose(hen({ walk: 1, peckUntilTick: 24 }), 24), "walk");
});

test("does reel a hurt hen over a peck, lay a downed one on her back and sit an away one still", () => {
  assert.equal(resolveHenPose(hen({ peckUntilTick: 20, hurtUntilTick: 12 }), 10), "hurt");
  assert.equal(resolveHenPose(hen({ state: "down", hurtUntilTick: 12 }), 10), "ko");
  assert.equal(resolveHenPose(hen({ state: "away", walk: 1 }), 10), "still");
});

test("does flicker a hen through her mercy window and dim one who sat out", () => {
  const spared = hen({ invulnerableUntilTick: 100 });

  assert.equal(resolveHenOpacity(spared, 0), 1);
  assert.equal(resolveHenOpacity(spared, 4), 0.35);
  assert.equal(resolveHenOpacity(spared, 100), 1);
  assert.equal(resolveHenOpacity(hen({ state: "away" }), 4), 0.4);
  assert.equal(resolveHenOpacity(hen({ state: "down", invulnerableUntilTick: 100 }), 4), 1);
});

test("does close the revive ring over the count and show none while nobody stands over her", () => {
  assert.equal(resolveReviveShare(hen({ state: "down", reviveSinceTick: null }), 50), 0);
  assert.equal(resolveReviveShare(hen({ state: "down", reviveSinceTick: 10 }), 10 + BRAWL_CREW_WORLD.reviveTicks / 2), 0.5);
  assert.equal(resolveReviveShare(hen({ state: "down", reviveSinceTick: 10 }), 500), 1);
  assert.equal(resolveReviveShare(hen({ state: "up", reviveSinceTick: 10 }), 50), 0);
});

test("does turn the bird to her facing about her own foot, lifted and tilted only when asked", () => {
  assert.equal(resolveHenBodyTransform({ facing: 1 }), `scale(${HEN_SCALE} ${HEN_SCALE})`);
  assert.equal(resolveHenBodyTransform({ facing: -1, lift: 12.5, tilt: 14 }), `translate(0 -12.5) rotate(14) scale(${-HEN_SCALE} ${HEN_SCALE})`);
});
