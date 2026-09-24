import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicZone } from "@wingnight/shared";

import { BLUFF_DEPTH, resolveGroundSegments } from "./index.js";

const flat = (samples: number): number[] => {
  return Array.from({ length: samples }, () => SCHLONIC_WORLD.groundBaseY);
};

const zoneOf = (pits: SchlonicZone["pits"]): SchlonicZone => ({
  heights: flat(21),
  pits,
  props: [],
  goalX: 200
});

test("draws unbroken ground as a single run", () => {
  const segments = resolveGroundSegments(zoneOf([]));

  assert.equal(segments.length, 1);
  assert.equal(segments[0]?.fromX, 0);
  assert.equal(segments[0]?.toX, 200);
});

test("closes the soil down to the bottom of the box so the ground is not a wire", () => {
  const segment = resolveGroundSegments(zoneOf([]), 90)[0];

  assert.ok(segment !== undefined);
  assert.ok(segment.fillPath.endsWith("Z"));
  assert.ok(segment.fillPath.includes("L 200 90 L 0 90"));
  assert.ok(!segment.topPath.includes("Z"), "the walking surface is a line, not a shape");
});

test("cuts a real gap at a pit, with a lip either side", () => {
  const segments = resolveGroundSegments(zoneOf([{ fromX: 60, toX: 82, lipY: SCHLONIC_WORLD.groundBaseY }]));

  assert.equal(segments.length, 2);
  assert.equal(segments[0]?.toX, 60);
  assert.equal(segments[1]?.fromX, 82);
});

test("cuts every pit in a real zone, and nothing else", () => {
  const zone = resolveSchlonicZone({ seed: 4, chunks: 14 });
  const segments = resolveGroundSegments(zone);

  assert.equal(segments.length, zone.pits.length + 1);
});

test("leaves no ground drawn across the inside of a hole", () => {
  const segments = resolveGroundSegments(zoneOf([{ fromX: 60, toX: 82, lipY: SCHLONIC_WORLD.groundBaseY }]));

  for (const segment of segments) {
    assert.ok(
      segment.toX <= 60 || segment.fromX >= 82,
      `a run spanned the hole: ${segment.fromX} to ${segment.toX}`
    );
  }
});

test("follows the surface back with a sand band under it", () => {
  const segment = resolveGroundSegments(zoneOf([]), 90)[0];

  assert.ok(segment !== undefined);
  assert.ok(segment.bluffPath.startsWith(segment.topPath));
  assert.ok(segment.bluffPath.endsWith("Z"));
  // Back along the same run at the band's depth: last surface point first, first point last.
  assert.ok(segment.bluffPath.includes(`L 200 ${SCHLONIC_WORLD.groundBaseY + BLUFF_DEPTH}`));
  assert.ok(segment.bluffPath.includes(`L 0 ${SCHLONIC_WORLD.groundBaseY + BLUFF_DEPTH} Z`));
});

test("keeps drawing level ground past the last sample when asked for a run-out", () => {
  const segments = resolveGroundSegments(zoneOf([]), 90, 120);

  assert.equal(segments.length, 1);
  assert.equal(segments[0]?.toX, 320);
  assert.ok(segments[0]?.topPath.endsWith(`L 320 ${SCHLONIC_WORLD.groundBaseY}`));
});

test("draws no run-out unless asked, so the geometry ends where the samples do", () => {
  assert.equal(resolveGroundSegments(zoneOf([]))[0]?.toX, 200);
});
