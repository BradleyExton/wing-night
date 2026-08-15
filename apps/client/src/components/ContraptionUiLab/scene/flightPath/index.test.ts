import assert from "node:assert/strict";
import test from "node:test";

import { type FlightWaypoints, hasReleased, resolveProjectilePoint } from "./index";

const waypoints: FlightWaypoints = {
  hand: { x: 100, y: 300 },
  deflect: { x: 400, y: 360 },
  can: { x: 700, y: 400 },
  floor: { x: 640, y: 460 }
};

test("keeps the projectile in the hand through the eating beat", () => {
  const point = resolveProjectilePoint("eating", 0.5, "landed", waypoints);

  assert.deepEqual(point, waypoints.hand);
});

test("still holds the projectile in the hand at the moment of release", () => {
  const point = resolveProjectilePoint("release", 0.9, "landed", waypoints);

  assert.deepEqual(point, waypoints.hand);
});

test("leaves the hand once flight begins", () => {
  const point = resolveProjectilePoint("flight", 0.25, "landed", waypoints);

  assert.notDeepEqual(point, waypoints.hand);
});

test("arcs above the straight line between hand and ramp during the first half of flight", () => {
  const point = resolveProjectilePoint("flight", 0.25, "landed", waypoints);
  const straightLineY = (waypoints.hand.y + waypoints.deflect.y) / 2;

  // Smaller y is higher on screen.
  assert.ok(point.y < straightLineY);
});

test("rests in the can when the run lands", () => {
  const point = resolveProjectilePoint("settle", 1, "landed", waypoints);

  assert.deepEqual(point, waypoints.can);
});

test("rests on the floor when the run misses", () => {
  const point = resolveProjectilePoint("settle", 1, "missed", waypoints);

  assert.deepEqual(point, waypoints.floor);
});

// The cleaner walks to the bone; the bone does not walk to the cleaner.
test("holds the projectile still on the floor through the cleanup beat", () => {
  const start = resolveProjectilePoint("cleanup", 0, "missed", waypoints);
  const end = resolveProjectilePoint("cleanup", 1, "missed", waypoints);

  assert.deepEqual(start, waypoints.floor);
  assert.deepEqual(end, waypoints.floor);
});

test("reports the projectile as still held during the eating beat", () => {
  assert.equal(hasReleased("eating"), false);
});

test("reports the projectile as released from the release beat onward", () => {
  assert.equal(hasReleased("release"), true);
});
