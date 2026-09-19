import assert from "node:assert/strict";
import test from "node:test";

import type { DrawingPromptReveal, DrawingStroke } from "@wingnight/shared";

import { resolveHeldSketch, resolveRevealKey } from "./index.js";

const stroke = (strokeId: string): DrawingStroke => ({
  strokeId,
  points: [{ x: 0.2, y: 0.3, t: 0 }],
  color: "#F3EEE2",
  size: 0.03
});

const reveal = (promptId: string, revealedAtMs: number): DrawingPromptReveal => ({
  promptId,
  promptText: promptId,
  outcome: "CORRECT",
  revealedAtMs,
  expiresAtMs: revealedAtMs + 2000
});

test("does hold nothing when no prompt has resolved", () => {
  assert.equal(
    resolveHeldSketch({
      heldSketch: null,
      revealKey: resolveRevealKey(null),
      strokes: [stroke("live")],
      previousStrokes: []
    }),
    null
  );
});

test("does hold the board the reveal caught when the runtime wipes the canvas", () => {
  const drawn = [stroke("a"), stroke("b")];
  const held = resolveHeldSketch({
    heldSketch: null,
    revealKey: resolveRevealKey(reveal("pizza", 1000)),
    strokes: [],
    previousStrokes: drawn
  });

  assert.deepEqual(held?.strokes, drawn);
});

test("does keep the held sketch while the same reveal is still up", () => {
  const first = resolveHeldSketch({
    heldSketch: null,
    revealKey: "pizza:1000",
    strokes: [],
    previousStrokes: [stroke("a")]
  });
  const second = resolveHeldSketch({
    heldSketch: first,
    revealKey: "pizza:1000",
    strokes: [],
    previousStrokes: []
  });

  assert.equal(second, first);
});

test("does hold nothing when a prompt resolves on a board nobody drew on", () => {
  const afterFirstReveal = resolveHeldSketch({
    heldSketch: null,
    revealKey: resolveRevealKey(reveal("pizza", 1000)),
    strokes: [],
    previousStrokes: [stroke("a")]
  });

  // The first reveal expired, the canvas stayed empty, and the host resolved
  // the next prompt without a single stroke — the earlier sketch must not
  // reappear under the new plaque.
  const afterSecondReveal = resolveHeldSketch({
    heldSketch: afterFirstReveal,
    revealKey: resolveRevealKey(reveal("campfire", 5000)),
    strokes: [],
    previousStrokes: []
  });

  assert.deepEqual(afterSecondReveal?.strokes, []);
});

test("does hold nothing when the host clears the board before resolving", () => {
  const cleared = resolveHeldSketch({
    heldSketch: {
      revealKey: "pizza:1000",
      strokes: [stroke("a")]
    },
    revealKey: resolveRevealKey(reveal("campfire", 5000)),
    strokes: [],
    previousStrokes: []
  });

  assert.deepEqual(cleared?.strokes, []);
});

test("does treat a repeated prompt as its own reveal", () => {
  assert.notEqual(
    resolveRevealKey(reveal("pizza", 1000)),
    resolveRevealKey(reveal("pizza", 9000))
  );
});
