import assert from "node:assert/strict";
import test from "node:test";

import { MAX_EMOJIS_PER_SUBJECT } from "../../runtime/types/index.js";
import { resolveClueCue } from "./index.js";

test("does pop higher as the clue fills up", () => {
  assert.deepEqual(resolveClueCue(0, 1), { cue: "pop", intensity: 0 });
  assert.deepEqual(resolveClueCue(MAX_EMOJIS_PER_SUBJECT - 1, MAX_EMOJIS_PER_SUBJECT), {
    cue: "pop",
    intensity: 1
  });
});

test("does unpop an emoji taken off and stay quiet when the clue is wiped", () => {
  assert.deepEqual(resolveClueCue(3, 2), { cue: "unpop" });
  assert.equal(resolveClueCue(3, 0), null);
});

test("does stay quiet on the first reading and on no change", () => {
  assert.equal(resolveClueCue(undefined, 2), null);
  assert.equal(resolveClueCue(2, 2), null);
});
