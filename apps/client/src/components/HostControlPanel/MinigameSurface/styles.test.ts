import assert from "node:assert/strict";
import test from "node:test";

import { takeoverInner } from "./styles";

// docs/takeover-layout-api.md P4, accepted by the owner. The takeover used to
// be a scroll container, which existed to stop an overgrown minigame bleeding
// under the CTA bar — a bar that does not exist on this phase. A takeover that
// scrolls is a takeover whose layout is wrong, and nine migrations are exactly
// the moment to hear about it: a body taller than the tablet now breaks
// visibly instead of scrolling quietly.
test("does not scroll the takeover when a minigame overgrows the canvas", () => {
  assert.doesNotMatch(takeoverInner, /overflow/);
});

// Dropping the scroll must not drop the full-height box the layouts resolve
// `h-full` against: both layout roots are `h-full`, and a wrapper that only
// carried `min-h-full` would let a short body sit at content height.
test("does still hand the layout a full-height box", () => {
  assert.match(takeoverInner, /\bflex\b/);
  assert.match(takeoverInner, /\bmin-h-0\b/);
  assert.match(takeoverInner, /\bflex-1\b/);
  assert.match(takeoverInner, /\[&>\*\]:min-h-full/);
});
