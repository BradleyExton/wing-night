import assert from "node:assert/strict";
import test from "node:test";

import {
  BEATS,
  SEQUENCE_DURATION_MS,
  resolveSequencePosition,
  resolveVisibleBeats
} from "./index";

test("opens on the EATING beat so the throw hands off from a real phase", () => {
  assert.equal(BEATS[0].id, "eating");
});

test("ends on the cleanup beat so the miss has a punchline to land on", () => {
  assert.equal(BEATS[BEATS.length - 1].id, "cleanup");
});

test("holds on the first beat when elapsed time is zero", () => {
  const position = resolveSequencePosition(0);

  assert.equal(position.beat.id, "eating");
  assert.equal(position.progress, 0);
});

test("reports progress through the beat that contains the elapsed time", () => {
  const position = resolveSequencePosition(BEATS[0].durationMs / 2);

  assert.equal(position.beat.id, "eating");
  assert.equal(position.progress, 0.5);
});

test("advances to the next beat once the previous one has elapsed", () => {
  const position = resolveSequencePosition(BEATS[0].durationMs);

  assert.equal(position.beat.id, "release");
  assert.equal(position.index, 1);
});

// Clamping rather than wrapping is the deliberate choice: a human studying the final frame should
// not have the sequence restart under them.
test("holds on the final frame when elapsed time runs past the sequence", () => {
  const position = resolveSequencePosition(SEQUENCE_DURATION_MS * 3);

  assert.equal(position.beat.id, "cleanup");
  assert.equal(position.progress, 1);
});

test("clamps to the first beat when elapsed time is negative", () => {
  const position = resolveSequencePosition(-500);

  assert.equal(position.beat.id, "eating");
  assert.equal(position.progress, 0);
});

test("drops the cleanup beat when the run lands, since no one has to tidy up", () => {
  const visible = resolveVisibleBeats("landed");

  assert.ok(!visible.some((beat) => beat.id === "cleanup"));
});

test("keeps the cleanup beat when the run misses", () => {
  const visible = resolveVisibleBeats("missed");

  assert.ok(visible.some((beat) => beat.id === "cleanup"));
});
