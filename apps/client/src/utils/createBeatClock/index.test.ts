import assert from "node:assert/strict";
import test from "node:test";

import { BEAT_CLOCK_DEFAULTS, createBeatClock, type BeatClockVerdict } from "./index";

const FRAME_MS = 1000 / 60;

// Feeds `frames` readings of `energy` from `fromMs`, one a frame, and returns
// every verdict with the time it landed on.
const run = (
  clock: ReturnType<typeof createBeatClock>,
  fromMs: number,
  frames: number,
  energy: (frame: number) => number
): Array<{ atMs: number; verdict: BeatClockVerdict }> => {
  const verdicts: Array<{ atMs: number; verdict: BeatClockVerdict }> = [];

  for (let frame = 0; frame < frames; frame += 1) {
    const atMs = fromMs + frame * FRAME_MS;
    const verdict = clock.feed(energy(frame), atMs);

    if (verdict !== null) {
      verdicts.push({ atMs, verdict });
    }
  }

  return verdicts;
};

test("does keep 120 BPM time on its own when it hears nothing", () => {
  const verdicts = run(createBeatClock(), 0, 120, () => 0);

  assert.ok(verdicts.length >= 3);
  assert.ok(verdicts.every(({ verdict }) => verdict === "fallback"));

  for (let index = 1; index < verdicts.length; index += 1) {
    const gap = verdicts[index].atMs - verdicts[index - 1].atMs;
    assert.ok(gap >= BEAT_CLOCK_DEFAULTS.fallbackIntervalMs, `gap ${gap}`);
    assert.ok(gap < BEAT_CLOCK_DEFAULTS.fallbackIntervalMs + FRAME_MS * 2, `gap ${gap}`);
  }
});

test("does call a kick when the low band spikes well above its recent average", () => {
  const clock = createBeatClock();
  const quiet = run(clock, 0, 30, () => 300);
  const [spike] = run(clock, 30 * FRAME_MS, 1, () => 900);

  assert.ok(quiet.every(({ verdict }) => verdict === "fallback"));
  assert.equal(spike?.verdict, "beat");
});

test("does not call a kick on a spike that never clears the silence floor", () => {
  const clock = createBeatClock();
  run(clock, 0, 30, () => 20);
  const verdicts = run(clock, 30 * FRAME_MS, 1, () => 200);

  assert.notEqual(verdicts[0]?.verdict, "beat");
});

test("does ignore a second spike inside the refractory gap after a kick", () => {
  const clock = createBeatClock();
  run(clock, 0, 30, () => 300);
  const first = run(clock, 30 * FRAME_MS, 1, () => 900);
  const second = run(clock, 30 * FRAME_MS + 100, 1, () => 1200);

  assert.equal(first[0]?.verdict, "beat");
  assert.equal(second.length, 0);
});

test("does hold its own beats back while the music is carrying them", () => {
  const clock = createBeatClock();
  run(clock, 0, 30, () => 300);
  run(clock, 30 * FRAME_MS, 1, () => 900);
  // Steady playing after the kick: no spikes, but heard recently.
  const verdicts = run(clock, 31 * FRAME_MS, 60, () => 300);

  assert.equal(verdicts.length, 0);
});

test("does take time back over once the music has been quiet long enough", () => {
  const clock = createBeatClock();
  run(clock, 0, 30, () => 300);
  run(clock, 30 * FRAME_MS, 1, () => 900);
  const lastBeatMs = 30 * FRAME_MS;
  const verdicts = run(clock, 31 * FRAME_MS, 200, () => 0);
  const firstFallback = verdicts.find(({ verdict }) => verdict === "fallback");

  assert.ok(firstFallback !== undefined);
  assert.ok(firstFallback.atMs - lastBeatMs >= BEAT_CLOCK_DEFAULTS.silenceMs);
});
