import assert from "node:assert/strict";
import test from "node:test";

import type { Segment } from "../../types.js";
import type { BodyStep, ContactMaterial } from "./index.js";
import { resolveSegmentContacts } from "./index.js";

const FLOOR: Segment = { id: "floor", from: { x: 0, y: 10 }, to: { x: 20, y: 10 } };

const material = (overrides: Partial<ContactMaterial> = {}): ContactMaterial => {
  return { radius: 1, restitution: 0.5, slip: 1, ...overrides };
};

const falling = (overrides: Partial<BodyStep> = {}): BodyStep => {
  return { x: 5, y: 9.5, previousX: 5, previousY: 9, ...overrides };
};

test("returns the step untouched when the circle is clear of every segment", () => {
  const step = falling({ y: 5, previousY: 4.6 });

  assert.equal(resolveSegmentContacts(step, material(), [FLOOR]), step);
});

test("lifts the circle back to resting contact when it has sunk into a segment", () => {
  const resolved = resolveSegmentContacts(falling(), material(), [FLOOR]);

  assert.equal(resolved.y, 9);
});

test("reverses the approach velocity scaled by restitution when it hits a segment", () => {
  const step = falling({ y: 9.5, previousY: 9 });

  const resolved = resolveSegmentContacts(step, material({ restitution: 0.5 }), [FLOOR]);

  // Approach was +0.5 per step downward; half of it comes back as upward travel.
  assert.equal(resolved.y - resolved.previousY, -0.25);
});

test("keeps the circle sliding along a segment when slip is total", () => {
  const step = falling({ x: 5, previousX: 4.5 });

  const resolved = resolveSegmentContacts(step, material({ slip: 1 }), [FLOOR]);

  assert.equal(resolved.x - resolved.previousX, 0.5);
});

test("drops the tangential velocity when slip is zero", () => {
  const step = falling({ x: 5, previousX: 4.5 });

  const resolved = resolveSegmentContacts(step, material({ slip: 0 }), [FLOOR]);

  assert.equal(resolved.x - resolved.previousX, 0);
});

test("adds no bounce when the overlapping circle is already moving away", () => {
  const step = falling({ y: 9.5, previousY: 10 });

  const resolved = resolveSegmentContacts(step, material(), [FLOOR]);

  assert.equal(resolved.y - resolved.previousY, -0.5);
});

// The centre-to-surface direction is undefined here, so the fallback's *sign* is arbitrary — only
// its magnitude is a real invariant. Asserting the distance keeps the test honest about that.
test("pushes the circle a full radius clear when its centre sits exactly on a segment", () => {
  const step: BodyStep = { x: 5, y: 10, previousX: 5, previousY: 10 };

  const resolved = resolveSegmentContacts(step, material(), [FLOOR]);

  assert.equal(resolved.x, 5);
  assert.equal(Math.abs(resolved.y - FLOOR.from.y), 1);
});

test("settles against every segment when a circle is wedged into a corner", () => {
  const wall: Segment = { id: "wall", from: { x: 4, y: 0 }, to: { x: 4, y: 10 } };
  const step: BodyStep = { x: 4.5, y: 9.5, previousX: 4.5, previousY: 9.5 };

  const resolved = resolveSegmentContacts(step, material(), [FLOOR, wall]);

  assert.equal(resolved.x, 5);
  assert.equal(resolved.y, 9);
});
