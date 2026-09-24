import assert from "node:assert/strict";
import test from "node:test";

import { resolveClockSoundCue } from "./index";

test("does tick on each second under ten and not above", () => {
  assert.equal(resolveClockSoundCue(12, 11), null);
  assert.equal(resolveClockSoundCue(11, 10), "tick");
  assert.equal(resolveClockSoundCue(10, 9), "tick");
  assert.equal(resolveClockSoundCue(2, 1), "tick");
});

test("does buzz time's up when the clock reaches zero", () => {
  assert.equal(resolveClockSoundCue(1, 0), "timesUp");
});

test("does say nothing while the second has not changed", () => {
  // The countdown re-renders four times a second; the same second is one tick.
  assert.equal(resolveClockSoundCue(7, 7), null);
  assert.equal(resolveClockSoundCue(0, 0), null);
});

test("does say nothing on the first reading", () => {
  // A display that mounts, or refreshes, with seven seconds left waits for the
  // next second; one that mounts on zero does not buzz a time's up the room
  // already heard.
  assert.equal(resolveClockSoundCue(null, 7), null);
  assert.equal(resolveClockSoundCue(null, 0), null);
});

test("does stay silent for a room with no clock", () => {
  assert.equal(resolveClockSoundCue(null, null), null);
  assert.equal(resolveClockSoundCue(5, null), null);
});

test("does not tick when the host extends the clock", () => {
  // Three to eight is up, not down: a tick there would count the wrong way.
  assert.equal(resolveClockSoundCue(3, 8), null);
  // And out of the last ten altogether is a calm clock again.
  assert.equal(resolveClockSoundCue(3, 33), null);
});

test("does buzz again when an extended clock runs out a second time", () => {
  // The escape hatch is never removed (AGENTS.md §11): a host who extends past
  // zero gets a second time's up when the extension runs out too.
  assert.equal(resolveClockSoundCue(0, 30), null);
  assert.equal(resolveClockSoundCue(1, 0), "timesUp");
});
