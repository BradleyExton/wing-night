import assert from "node:assert/strict";
import test from "node:test";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HeartRow } from "./index.js";

const glyphs = (markup: string): number => (markup.match(/data-lit="true"/g) ?? []).length;

test("does draw three lit hearts when the block starts on three", () => {
  const markup = renderToStaticMarkup(<HeartRow max={3} rowRef={createRef()} tone="chrome" />);

  assert.ok(markup.includes('data-brawl-hearts="3"'));
  assert.equal(glyphs(markup), 3);
});

test("does draw four lit hearts when the team bought a heart at the handoff", () => {
  for (const tone of ["chrome", "marquee"] as const) {
    const markup = renderToStaticMarkup(<HeartRow max={4} rowRef={createRef()} tone={tone} />);

    assert.ok(markup.includes('data-brawl-hearts="4"'));
    assert.equal(glyphs(markup), 4);
    assert.equal((markup.match(/♥/g) ?? []).length, 4);
  }
});
