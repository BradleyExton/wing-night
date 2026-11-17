import assert from "node:assert/strict";
import test from "node:test";

import { BRAWL_CREW_WORLD } from "@wingnight/shared";

import { STREET_BANDS, resolveBrawlSetting, resolveGlints, resolveGroundY, resolveStops, resolveStreetExtent } from "./index.js";

test("does put block one on Dunlop, two on the waterfront and the rest on the beach", () => {
  assert.equal(resolveBrawlSetting(0), "dunlop");
  assert.equal(resolveBrawlSetting(1), "waterfront");
  assert.equal(resolveBrawlSetting(2), "beach");
  assert.equal(resolveBrawlSetting(5), "beach");
});

test("does draw the street past both ends of the block", () => {
  const extent = resolveStreetExtent({ length: 480 });

  assert.ok(extent.left < 0);
  assert.ok(extent.right > 480 + BRAWL_CREW_WORLD.width);
});

test("does stand a figure down the band by its depth, from the sim's ground line to inside the window", () => {
  assert.equal(resolveGroundY(0), BRAWL_CREW_WORLD.groundY);
  assert.equal(resolveGroundY(BRAWL_CREW_WORLD.depth), STREET_BANDS.bandFrontY);
  assert.ok(STREET_BANDS.bandFrontY < BRAWL_CREW_WORLD.height, "the front of the band is off the bottom of the window");
});

test("does keep every setting's walkable ground behind the band's back and past its front", () => {
  assert.ok(STREET_BANDS.roadTop <= STREET_BANDS.bandBackY && STREET_BANDS.roadBottom >= STREET_BANDS.bandFrontY, "Dunlop's road");
  assert.ok(STREET_BANDS.boardwalkTop <= STREET_BANDS.bandBackY, "the boardwalk");
  assert.ok(STREET_BANDS.beachShoreY <= STREET_BANDS.bandBackY, "the sand");
});

test("does lay stops on the multiples of the step inside the extent", () => {
  assert.deepEqual(resolveStops({ left: -10, right: 35 }, 16), [0, 16, 32]);
  assert.deepEqual(resolveStops({ left: -10, right: 35 }, 16, 4), [4, 20]);
});

test("does lay the same glints inside the water band on every call", () => {
  const glints = resolveGlints({ left: 0, right: 100 }, 30, 50);

  assert.deepEqual(glints, resolveGlints({ left: 0, right: 100 }, 30, 50));
  assert.ok(glints.every((glint) => glint.y >= 30 && glint.y <= 50));
});
