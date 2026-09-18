import assert from "node:assert/strict";
import test from "node:test";

import type { ContraptionMinigameRun } from "@wingnight/shared";

import {
  CLEANUP_SECONDS,
  resolveLastPlayedFrame,
  resolveRunSequence,
  resolveSequenceDurationMs,
  resolveTrackPositions,
  SETTLE_HOLD_SECONDS,
  VERDICT_SECONDS
} from "./index.js";

// 151 frames at 30Hz = a 5s track; settled at 2s.
const run = (overrides: Partial<ContraptionMinigameRun> = {}): ContraptionMinigameRun => ({
  attemptNumber: 1,
  track: {
    keyframeHz: 30,
    positions: Array.from({ length: 151 * 2 }, (_unused, index) => index)
  },
  outcome: "short",
  settleSeconds: 2,
  collectedPickupIds: [],
  points: 0,
  replayToken: 0,
  ...overrides
});

test("cuts playback a beat after the settle instead of running the whole track", () => {
  assert.equal(resolveLastPlayedFrame(run()), Math.round((2 + SETTLE_HOLD_SECONDS) * 30));
});

test("plays the whole track when the wing never settled", () => {
  assert.equal(resolveLastPlayedFrame(run({ settleSeconds: null, outcome: "restless" })), 150);
});

test("advances one frame per keyframe interval during flight", () => {
  assert.deepEqual(resolveRunSequence(0, run()), {
    frameIndex: 0,
    stage: "flight",
    cleanupProgress: 0
  });
  assert.equal(resolveRunSequence(1000, run()).frameIndex, 30);
  assert.equal(resolveRunSequence(-50, run()).frameIndex, 0);
});

test("holds the last frame through the verdict, then walks the cleaner on for a miss", () => {
  const flightMs = ((2 + SETTLE_HOLD_SECONDS) * 30 / 30) * 1000;
  const midVerdict = resolveRunSequence(flightMs + 100, run());
  const midCleanup = resolveRunSequence(
    flightMs + VERDICT_SECONDS * 1000 + (CLEANUP_SECONDS * 1000) / 2,
    run()
  );
  const afterwards = resolveRunSequence(flightMs + 60_000, run());

  assert.equal(midVerdict.stage, "verdict");
  assert.equal(midVerdict.frameIndex, resolveLastPlayedFrame(run()));
  assert.equal(midCleanup.stage, "cleanup");
  assert.ok(Math.abs(midCleanup.cleanupProgress - 0.5) < 0.01);
  assert.deepEqual(afterwards, {
    frameIndex: resolveLastPlayedFrame(run()),
    stage: "held",
    cleanupProgress: 1
  });
});

test("skips the cleanup beat when the wing landed", () => {
  const landed = run({ outcome: "landed" });
  const flightMs = ((2 + SETTLE_HOLD_SECONDS) * 30 / 30) * 1000;

  assert.equal(resolveRunSequence(flightMs + VERDICT_SECONDS * 1000 + 10, landed).stage, "held");
  assert.equal(
    resolveSequenceDurationMs(landed),
    resolveSequenceDurationMs(run()) - CLEANUP_SECONDS * 1000
  );
});

test("decodes the flat track back into points", () => {
  const positions = resolveTrackPositions(run());

  assert.equal(positions.length, 151);
  assert.deepEqual(positions[1], { x: 2, y: 3 });
});
