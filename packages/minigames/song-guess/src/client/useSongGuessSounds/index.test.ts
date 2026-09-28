import assert from "node:assert/strict";
import test from "node:test";

import { resolveClipCue } from "./index.js";

test("does scratch when a playing clip is paused for the lock-in", () => {
  assert.equal(resolveClipCue("clip_playing", "clip_paused"), "scratch");
});

test("does stay quiet on any other change of phase", () => {
  assert.equal(resolveClipCue(undefined, "clip_paused"), null);
  assert.equal(resolveClipCue("idle", "clip_playing"), null);
  assert.equal(resolveClipCue("clip_paused", "reveal"), null);
  assert.equal(resolveClipCue("clip_paused", "clip_playing"), null);
});
