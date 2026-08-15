import assert from "node:assert/strict";
import test from "node:test";

import { BENCHMARK_LAYOUT } from "../benchmarkLayout/index.js";
import type { Layout, SimulateOptions } from "../types.js";
import { simulate } from "./index.js";

const FLOOR_Y = 10;

const DROP_RADIUS = 1;

const dropTest: Layout = {
  gravity: { x: 0, y: 20 },
  segments: [
    { id: "floor", from: { x: 0, y: FLOOR_Y }, to: { x: 20, y: FLOOR_Y } }
  ],
  bodies: [
    {
      id: "ball",
      origin: { x: 5, y: 0 },
      radius: DROP_RADIUS,
      restitution: 0,
      slip: 1
    }
  ]
};

const options = (overrides: Partial<SimulateOptions> = {}): SimulateOptions => {
  return {
    seed: 1234,
    durationSeconds: 4,
    stepHz: 240,
    keyframeHz: 30,
    ...overrides
  };
};

// Same-process replay stability only. This does NOT establish the cross-engine reproducibility
// WN-15's option (b) needs — that rests on the module using no implementation-defined Math member,
// which `../noTranscendentals.test.ts` is the (still only necessary, not sufficient) guard for.
test("produces a byte-identical track when the same layout and seed are re-simulated", () => {
  const first = simulate(BENCHMARK_LAYOUT, options());
  const second = simulate(BENCHMARK_LAYOUT, options());

  assert.equal(JSON.stringify(second), JSON.stringify(first));
});

test("starts the bodies at different offsets when the seed differs", () => {
  const first = simulate(BENCHMARK_LAYOUT, options({ seed: 1234 }));
  const second = simulate(BENCHMARK_LAYOUT, options({ seed: 5678 }));

  assert.notEqual(
    JSON.stringify(second.keyframes[0]),
    JSON.stringify(first.keyframes[0])
  );
});

test("keeps the seed's effect sub-unit so a layout still reads as the build the team laid out", () => {
  const run = simulate(BENCHMARK_LAYOUT, options({ seed: 5678 }));

  run.keyframes[0].forEach((point, index) => {
    const origin = BENCHMARK_LAYOUT.bodies[index].origin;
    assert.ok(Math.abs(point.x - origin.x) < 0.01);
    assert.ok(Math.abs(point.y - origin.y) < 0.01);
  });
});

test("settles a dropped body onto the surface it lands on", () => {
  const run = simulate(dropTest, options({ durationSeconds: 3 }));
  const resting = run.keyframes[run.keyframes.length - 1][0];

  assert.ok(
    Math.abs(resting.y - (FLOOR_Y - DROP_RADIUS)) < 1e-6,
    `expected the ball to rest at y=${FLOOR_Y - DROP_RADIUS}, got ${resting.y}`
  );
});

test("reports one point per body in layout order on every keyframe", () => {
  const run = simulate(BENCHMARK_LAYOUT, options());

  run.keyframes.forEach((keyframe) => {
    assert.equal(keyframe.length, BENCHMARK_LAYOUT.bodies.length);
  });
});

test("emits one keyframe per sampling interval plus the starting frame", () => {
  const run = simulate(BENCHMARK_LAYOUT, options({ durationSeconds: 4, keyframeHz: 30 }));

  assert.equal(run.keyframes.length, 4 * 30 + 1);
});

// The byte figures at 30fps and 20fps are only comparable if the underlying motion is identical —
// keyframeHz must choose the sampling rate and nothing else.
test("describes identical motion at 20fps and 30fps when the integration rate is unchanged", () => {
  const fast = simulate(BENCHMARK_LAYOUT, options({ keyframeHz: 30 }));
  const slow = simulate(BENCHMARK_LAYOUT, options({ keyframeHz: 20 }));

  for (let tenth = 0; tenth <= 40; tenth += 1) {
    assert.deepEqual(slow.keyframes[tenth * 2], fast.keyframes[tenth * 3]);
  }
});

test("throws when stepHz is not a whole multiple of keyframeHz", () => {
  assert.throws(
    () => simulate(BENCHMARK_LAYOUT, options({ stepHz: 100, keyframeHz: 30 })),
    RangeError
  );
});

test("throws when durationSeconds is not positive", () => {
  assert.throws(
    () => simulate(BENCHMARK_LAYOUT, options({ durationSeconds: 0 })),
    RangeError
  );
});

// ── WN-23 behavioural pins ────────────────────────────────────────────────────────────────────
// Two pins, because either alone is satisfiable by a degenerate model: "it slides" alone passes a
// frictionless integrator, and "it stops" alone passes the creep bug this ticket fixes. Together
// they fence both failure modes.
//
// BOTH ARE RED AGAINST THE PRE-WN-23 IMPLEMENTATION, confirmed by stashing the change and running
// them — not by assertion. Under the old flat per-step multiplier `slip` was a retention factor, so
// slip 0.1 multiplied tangential velocity by 0.1 on EVERY contacting step (0.1^240 ≈ 0) and the
// body creeps to a dead stop instead of sliding.

const RAMP_FROM = { x: 0, y: 10 };

const RAMP_TO = { x: 60, y: 34 };

/** A shallow ramp, and a body resting on it just below the top. */
const rampTest = (slip: number): Layout => {
  return {
    gravity: { x: 0, y: 30 },
    segments: [{ id: "ramp", from: RAMP_FROM, to: RAMP_TO }],
    bodies: [
      {
        id: "slider",
        origin: { x: 6, y: 11.5 },
        radius: 1,
        restitution: 0,
        slip
      }
    ]
  };
};

/** Distance the body covered along the ramp direction, first keyframe to last. */
const travelAlongRamp = (run: ReturnType<typeof simulate>): number => {
  const alongX = RAMP_TO.x - RAMP_FROM.x;
  const alongY = RAMP_TO.y - RAMP_FROM.y;
  const length = Math.sqrt(alongX * alongX + alongY * alongY);
  const first = run.keyframes[0][0];
  const last = run.keyframes[run.keyframes.length - 1][0];

  return ((last.x - first.x) * alongX + (last.y - first.y) * alongY) / length;
};

test("slides a low-friction body a meaningful distance down a shallow ramp", () => {
  const run = simulate(rampTest(0.1), options({ durationSeconds: 3 }));

  // The whole point of the fix: a body released on a ramp travels ALONG it. The pre-WN-23
  // implementation creeps to a stop within a few units.
  assert.ok(
    travelAlongRamp(run) > 20,
    `expected a low-friction body to slide, travelled ${travelAlongRamp(run)}`
  );
});

test("brings a high-friction body to rest instead of sliding forever", () => {
  const run = simulate(rampTest(5), options({ durationSeconds: 3 }));

  // Friction must still EXIST — without this pin, deleting friction entirely passes the slide pin.
  assert.ok(
    travelAlongRamp(run) < 5,
    `expected a high-friction body to grip, travelled ${travelAlongRamp(run)}`
  );
});
