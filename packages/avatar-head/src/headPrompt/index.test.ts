import assert from "node:assert/strict";
import test from "node:test";

import { assemblePrompt } from "./index.ts";

test("does add the style reference clause only when a reference is given", () => {
  assert.doesNotMatch(assemblePrompt({ hasStyleReference: false }), /STYLE REFERENCE/);
  assert.match(assemblePrompt({ hasStyleReference: true }), /STYLE REFERENCE/);
  assert.match(assemblePrompt({ hasStyleReference: true }), /DIFFERENT person/);
});

test("does open on the locked system and forbid invented accessories when assembled", () => {
  const prompt = assemblePrompt({ hasStyleReference: false });

  assert.match(prompt, /^Use the locked illustration system below/);
  assert.match(prompt, /Do not add glasses/);
});

test("does ask for the chroma background and a head-only crop when assembled", () => {
  const prompt = assemblePrompt({ hasStyleReference: false });

  assert.match(prompt, /#FF00FF/);
  assert.match(prompt, /Head ONLY/);
  assert.match(prompt, /nothing below the chin/);
});
