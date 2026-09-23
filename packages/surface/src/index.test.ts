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

// T5.2: the TV marquee's two text styles were byte-identical across six
// display surfaces (DRAWING, JOUST, FAPPY, SCHLONIC, GEO, EMOJI_CHARADES),
// and the bulb ring across three of them.
test("does export the marquee's shared text styles and its bulb ring", () => {
  assert.equal(typeof surface.marqueeTeamName, "string");
  assert.equal(typeof surface.marqueeTitle, "string");
  assert.equal(typeof surface.marqueeBulbs, "string");
});

// The lesson `RunningTotals` taught: its three "identical" copies were written
// in JOUST's private desert hexes and had to be mapped onto house tokens one
// for one before they could move. A house path carries no raw hex, so if a
// marquee token ever gains one the move was done wrong.
test("does keep every marquee token on house tokens rather than raw hex", () => {
  const marqueeTokens = Object.entries(surface).filter(([name]) => name.startsWith("marquee"));

  assert.ok(marqueeTokens.length > 0);
  for (const [name, value] of marqueeTokens) {
    assert.doesNotMatch(String(value), /#[0-9a-fA-F]{3,8}\b/, `${name} carries a raw hex`);
  }
});

// Refused at T5.2, the same shape §8 refused for the arena frame: the six
// marquee CONTAINERS are not byte-identical — two padding values and two
// backgrounds — so sharing one would mean a game handing its padding and its
// background in as a class string. That is a configuration prop by another
// name. Each game keeps its own container.
test("does export no marquee container for a game to configure", () => {
  assert.equal("marquee" in surface, false);
  assert.equal("marqueeContainer" in surface, false);
});
