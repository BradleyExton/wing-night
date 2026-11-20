import assert from "node:assert/strict";
import test from "node:test";

import { BEAT_MS } from "../../beats/index.js";
import { resolveBeatProgress, resolveLayerSlide } from "./index.js";

test("does slide a layer by a share of its own width, so the compositor moves it and nothing repaints", () => {
  assert.equal(resolveLayerSlide({ left: -100, right: 500 }, 0), "translate3d(0%, 0, 0)");
  assert.equal(resolveLayerSlide({ left: -100, right: 500 }, 60), "translate3d(-10%, 0, 0)");
  assert.equal(resolveLayerSlide({ left: -240, right: 1188 }, 192), "translate3d(-13.45%, 0, 0)");
});

test("does run an ending over its own length on the screen's clock and then hold its last moment", () => {
  const beat = { outcome: "wipe" as const, startedAtMs: 1000 };

  assert.equal(resolveBeatProgress(beat, 1000), 0);
  assert.equal(resolveBeatProgress(beat, 1000 + BEAT_MS.wipe / 2), 0.5);
  assert.equal(resolveBeatProgress(beat, 1000 + BEAT_MS.wipe * 3), 1);
  assert.equal(resolveBeatProgress(beat, 0), 0);
});

test("does show an ending this screen never saw happen as already over", () => {
  assert.equal(resolveBeatProgress({ outcome: "cleared", startedAtMs: null }, 5), 1);
});
