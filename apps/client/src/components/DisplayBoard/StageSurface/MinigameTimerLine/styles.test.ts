import assert from "node:assert/strict";
import test from "node:test";

import { lit, litUrgent, tip } from "./styles";

// The lit length is positioned INSIDE the marquee's track and only there; the
// track is the marquee's (`packages/surface`, `NeonMarquee`), so nothing here
// may size or place itself against the stage the way the old corner chip did.
test("does position itself only within the track it lights", () => {
  for (const className of [lit, litUrgent]) {
    assert.match(className, /\babsolute\b/);
    assert.doesNotMatch(className, /\b(fixed|sticky)\b/);
    assert.doesNotMatch(className, /\bz-/);
  }
  assert.match(tip, /-right-\[/);
});

// Time as space: the width is the clock, so the line must move smoothly
// between whole-second updates rather than step.
test("does ease the width between ticks", () => {
  for (const className of [lit, litUrgent]) {
    assert.match(className, /transition-\[width\]/);
    assert.match(className, /ease-linear/);
  }
});
