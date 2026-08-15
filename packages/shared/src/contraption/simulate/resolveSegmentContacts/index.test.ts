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

// The next two cases are DELIBERATELY RE-SPECIFIED, not weakened (WN-23 AC-5). They previously read
// `slip` as a retention factor — slip 1 kept all tangential velocity, slip 0 dropped it. Under
// impulse-bounded Coulomb, `slip` is a friction COEFFICIENT and the meaning inverts: 0 is
// frictionless, and a large coefficient removes tangential motion up to the bound the normal
// impulse pays for. Same two situations, same shape of assertion, opposite expected values —
// because the model behind them is the one being replaced.
test("keeps the circle sliding along a segment when the friction coefficient is zero", () => {
  const step = falling({ x: 5, previousX: 4.5 });

  const resolved = resolveSegmentContacts(step, material({ slip: 0 }), [FLOOR]);

  assert.equal(resolved.x - resolved.previousX, 0.5);
});

// Tangential speed is 0.5 and the normal impulse is |-0.5| * (1 + 0.5) = 0.75, so a coefficient of
// 1 buys a 0.75 reduction — more than the 0.5 available.
test("drops the tangential velocity when the friction bound exceeds it", () => {
  const step = falling({ x: 5, previousX: 4.5 });

  const resolved = resolveSegmentContacts(step, material({ slip: 1 }), [FLOOR]);

  assert.equal(resolved.x - resolved.previousX, 0);
});

// The clamp, pinned on its own: an absurd coefficient must still only REMOVE tangential motion.
// Without the `min` this returns a reversed (negative) tangential velocity.
test("never reverses tangential direction however large the friction coefficient is", () => {
  const step = falling({ x: 5, previousX: 4.5 });

  const resolved = resolveSegmentContacts(step, material({ slip: 1000 }), [FLOOR]);

  assert.equal(resolved.x - resolved.previousX, 0);
});

// The partial regime — the bound is smaller than the tangential speed, so friction takes a bite
// rather than everything. This is where a body sliding down a ramp actually lives, and it is what
// the flat per-step multiplier could never produce.
test("removes only the bounded share of tangential velocity when friction is partial", () => {
  const step = falling({ x: 5, previousX: 4.5 });

  // Bound = 0.2 * 0.75 = 0.15, against a tangential speed of 0.5.
  const resolved = resolveSegmentContacts(step, material({ slip: 0.2 }), [FLOOR]);

  assert.ok(Math.abs(resolved.x - resolved.previousX - 0.35) < 1e-12);
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
