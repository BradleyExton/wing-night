import assert from "node:assert/strict";
import test from "node:test";

import { subjectValueFor } from "./styles.js";

const fontSizeRem = (subjectText: string): number => {
  const size = /text-\[([\d.]+)rem\]/.exec(subjectValueFor(subjectText))?.[1];

  return Number(size);
};

test("draws a short name bigger than a long title", () => {
  assert.ok(fontSizeRem("Rosi") > fontSizeRem("Steve Burke"));
  assert.ok(fontSizeRem("Steve Burke") > fontSizeRem("Honey, I Shrunk the Kids"));
});

test("never draws a subject smaller than the old fixed card did", () => {
  // The card used to cap every subject at 2rem, which read small from the far
  // end of the sofa.
  assert.ok(fontSizeRem("A very long subject title that goes on and on") >= 1.8);
  assert.ok(fontSizeRem("Kaitlyn") > 2);
});
