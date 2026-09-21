import assert from "node:assert/strict";
import test from "node:test";

import type { EmojiCharadesSubjectReveal } from "@wingnight/shared";

import { resolveHeldClue, resolveRevealKey } from "./index.js";

const reveal = (
  subjectId: string,
  revealedAtMs: number
): EmojiCharadesSubjectReveal => ({
  subjectId,
  subjectText: subjectId,
  outcome: "CORRECT",
  revealedAtMs,
  expiresAtMs: revealedAtMs + 2000
});

test("does hold nothing while no verdict is on screen", () => {
  const held = resolveHeldClue({
    heldClue: null,
    revealKey: null,
    emojiSequence: ["🦖"],
    previousEmojiSequence: []
  });

  assert.equal(held, null);
});

test("does hold the clue the verdict wiped, not the empty board it left", () => {
  const held = resolveHeldClue({
    heldClue: null,
    revealKey: resolveRevealKey(reveal("jaws", 10)),
    emojiSequence: [],
    previousEmojiSequence: ["🦈", "🌊"]
  });

  assert.deepEqual(held?.emojiSequence, ["🦈", "🌊"]);
});

test("does keep holding the same clue for the life of one verdict", () => {
  const revealKey = resolveRevealKey(reveal("jaws", 10));
  const first = resolveHeldClue({
    heldClue: null,
    revealKey,
    emojiSequence: [],
    previousEmojiSequence: ["🦈"]
  });
  const second = resolveHeldClue({
    heldClue: first,
    revealKey,
    emojiSequence: [],
    previousEmojiSequence: []
  });

  assert.equal(second, first);
});

test("does not resurrect the last clue under the next verdict", () => {
  const first = resolveHeldClue({
    heldClue: null,
    revealKey: resolveRevealKey(reveal("jaws", 10)),
    emojiSequence: [],
    previousEmojiSequence: ["🦈"]
  });
  // The next subject was skipped on an untouched board.
  const second = resolveHeldClue({
    heldClue: first,
    revealKey: resolveRevealKey(reveal("rocky", 20)),
    emojiSequence: [],
    previousEmojiSequence: []
  });

  assert.deepEqual(second?.emojiSequence, []);
});

test("does treat a repeated subject as a new moment", () => {
  assert.notEqual(
    resolveRevealKey(reveal("jaws", 10)),
    resolveRevealKey(reveal("jaws", 20))
  );
});
