import assert from "node:assert/strict";
import test from "node:test";

import { paintHearts } from "./index.js";

type FakeElement = {
  attributes: Map<string, string>;
  children: FakeElement[];
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
};

const createElement = (children: FakeElement[] = []): FakeElement => {
  const attributes = new Map<string, string>();

  return {
    attributes,
    children,
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => {
      attributes.set(name, value);
    }
  };
};

test("does light one glyph per heart left and dim the rest when the hen is hit", () => {
  const glyphs = [createElement(), createElement(), createElement()];
  const row = createElement(glyphs);

  paintHearts(row as unknown as HTMLElement, 2);

  assert.equal(row.getAttribute("data-brawl-hearts"), "2");
  assert.deepEqual(
    glyphs.map((glyph) => glyph.getAttribute("data-lit")),
    ["true", "true", "false"]
  );
});

test("does nothing when there is no element to write into", () => {
  assert.doesNotThrow(() => {
    paintHearts(null, 3);
  });
});
