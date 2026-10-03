import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { BrawlHazardKind } from "@wingnight/shared";

import { Hazard } from "./index.js";

const render = (kind: BrawlHazardKind): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Hazard hazard={{ kind, x: 190, width: 24 }} />
    </svg>
  );

test("does draw each hazard kind as its own setting's piece of street, carrying its kind", () => {
  for (const kind of ["railing", "bay", "plinth"] as const) {
    assert.match(render(kind), new RegExp(`<g data-brawl-hazard="${kind}"`), kind);
    assert.doesNotMatch(render(kind), /NaN|Infinity|undefined|#[0-9a-fA-F]{3,6}\b/, kind);
  }
});
