import assert from "node:assert/strict";
import test from "node:test";

import {
  SCHLONIC_WORLD,
  isSchlonicInPit,
  isSchlonicOverPit,
  resolveSchlonicGroundSlope,
  resolveSchlonicGroundY,
  resolveSchlonicRingTotal,
  resolveSchlonicTickCap,
  resolveSchlonicZone
} from "./index.js";

const zoneOf = (seed: number, chunks = 12) => resolveSchlonicZone({ seed, chunks });

test("draws the same zone twice from the same seed", () => {
  assert.deepEqual(zoneOf(99), zoneOf(99));
});

test("draws a different zone from a different seed", () => {
  assert.notDeepEqual(zoneOf(1).heights, zoneOf(2).heights);
});

test("keeps the ground inside the box however the chunks stack up", () => {
  for (let seed = 0; seed < 40; seed += 1) {
    for (const height of zoneOf(seed, 30).heights) {
      assert.ok(
        height >= SCHLONIC_WORLD.groundMinY && height <= SCHLONIC_WORLD.groundMaxY,
        `seed ${seed} put the ground at ${height}`
      );
    }
  }
});

test("opens with two level chunks and closes on one, so the zone is readable off the line", () => {
  const zone = zoneOf(5, 12);
  const level = SCHLONIC_WORLD.chunkWidth * 2;

  for (let x = 0; x <= level; x += 5) {
    assert.equal(resolveSchlonicGroundY(zone, x), SCHLONIC_WORLD.groundBaseY);
    assert.equal(isSchlonicOverPit(zone, x), false);
  }

  assert.equal(resolveSchlonicGroundSlope(zone, zone.goalX - 20), 0);
});

test("deals every team the same mix of hard kit rather than rolling each slot", () => {
  for (let seed = 0; seed < 25; seed += 1) {
    const zone = zoneOf(seed, 22);
    const kinds = new Set(zone.props.map((prop) => prop.kind));

    assert.ok(zone.pits.length >= 1, `seed ${seed} laid no pit`);
    assert.ok(kinds.has("spike"), `seed ${seed} laid no spikes`);
    assert.ok(kinds.has("badnik"), `seed ${seed} laid no badnik`);
    assert.ok(kinds.has("spring"), `seed ${seed} laid no spring`);
  }
});

test("hangs enough rings that a clean run is worth chasing", () => {
  assert.ok(resolveSchlonicRingTotal(zoneOf(3, 22)) > 80);
});

test("keeps every ring inside the box and off the floor", () => {
  const zone = zoneOf(11, 24);

  for (const prop of zone.props) {
    assert.ok(prop.y >= 0 && prop.y <= SCHLONIC_WORLD.height, `prop at y ${prop.y}`);
  }
});

test("reads the ground straight between two samples", () => {
  const zone = zoneOf(4, 12);
  const step = SCHLONIC_WORLD.sampleStep;
  const from = zone.heights[8] ?? 0;
  const to = zone.heights[9] ?? 0;

  assert.equal(resolveSchlonicGroundY(zone, 8 * step), from);
  assert.equal(resolveSchlonicGroundY(zone, 8.5 * step), (from + to) / 2);
  assert.equal(resolveSchlonicGroundSlope(zone, 8 * step + 1), (to - from) / step);
});

test("holds nothing up over a pit, and calls the runner in once it drops below the lip", () => {
  const zone = zoneOf(1, 22);
  const pit = zone.pits[0];

  assert.ok(pit !== undefined);
  assert.equal(resolveSchlonicGroundY(zone, pit.fromX + 4), SCHLONIC_WORLD.pitFloorY);
  // Sailing over the hole is not falling into it.
  assert.equal(isSchlonicInPit(zone, pit.fromX + 4, pit.lipY - 20), false);
  assert.equal(isSchlonicInPit(zone, pit.fromX + 4, pit.lipY + 10), true);
  // The ground either side is solid.
  assert.equal(isSchlonicInPit(zone, pit.fromX - 2, pit.lipY + 10), false);
});

test("caps a run well past the time the post can possibly take to arrive", () => {
  const zone = zoneOf(2, 22);

  assert.ok(resolveSchlonicTickCap(zone) > zone.goalX / SCHLONIC_WORLD.topSpeed);
});
