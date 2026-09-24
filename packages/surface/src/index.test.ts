import assert from "node:assert/strict";
import { test } from "node:test";

import * as surface from "./index.js";

test("loads as a module namespace when imported", () => {
  assert.equal(typeof surface, "object");
});

test("does export both takeover layouts under their own names", () => {
  assert.equal(typeof surface.TakeoverStage, "function");
  assert.equal(typeof surface.TakeoverCanvas, "function");
});

// docs/takeover-layout-api.md §6: the 4.5rem bottom-right reserve is applied
// by the layouts and only by the layouts. Exporting the number as a token
// would be an invitation to hand-type a tenth reserve, which is the
// nine-reserve mess in three idioms that the layouts exist to end.
test("does export no dock-gutter token for a game to hand-type a reserve from", () => {
  const gutterish = Object.keys(surface).filter((name) => /gutter|dock|reserve/i.test(name));

  assert.deepEqual(gutterish, []);
});

// ADR-0006: the TV marquee is one component now, not three text tokens under
// a container each game copied. The refusal T5.2 recorded — "no marquee
// container for a game to configure" — still holds in the only way that
// matters: `NeonMarquee` takes content, never a class string.
test("does export the TV marquee as a component and no marquee tokens beside it", () => {
  assert.equal(typeof surface.NeonMarquee, "function");
  const marqueeTokens = Object.keys(surface).filter(
    (name) => name.startsWith("marquee") && typeof surface[name as keyof typeof surface] === "string"
  );

  assert.deepEqual(marqueeTokens, []);
});
