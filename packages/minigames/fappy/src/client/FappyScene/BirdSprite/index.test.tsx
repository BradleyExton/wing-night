import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { LegBird } from "../../resolveLegBird/index.js";
import { BirdSprite } from "./index.js";

const DRESSED: LegBird = {
  playerName: "Alex",
  appearance: {
    body: "round",
    comb: "crest",
    tail: "fan",
    dance: "bounce",
    outfit: {
      top: { item: "battle-vest-a" },
      sleeve: { item: "flame-sleeve-a" },
      tail: { item: "chain-loop-b" },
      boots: { item: "combat-boots-a" }
    }
  },
  apparel: undefined,
  silhouette: "spiky",
  fillClassName: "text-teamA"
};

const render = (): string =>
  renderToStaticMarkup(<BirdSprite bird={DRESSED} className="box" dataAttribute="data-fappy-bird" pose="fly" />);

// The beating wing goes between the hen's two slices, so a dressed bird reads as the cast's rig
// does: its Top and head paint over the wing, never under it.
test("does beat the wing between the body and the Top, as the rig stacks them", () => {
  const html = render();
  const under = html.indexOf('data-character-layer="underWing"');
  const wing = html.indexOf("data-character-wing");
  const sleeve = html.indexOf('data-outfit-slot="sleeve"');
  const over = html.indexOf('data-character-layer="overWing"');
  const top = html.indexOf('data-outfit-slot="top"');
  const head = html.indexOf('data-character-part="head"');

  assert.ok(under >= 0 && under < wing && wing < sleeve && sleeve < over && over < top && top < head);
});

test("does draw every part of the dressed hen exactly once across its three layers", () => {
  const html = render();
  const count = (pattern: RegExp): number => html.match(pattern)?.length ?? 0;

  assert.equal(count(/data-character-part="head"/g), 1);
  assert.equal(count(/data-outfit-slot="top"/g), 1);
  assert.equal(count(/data-outfit-slot="sleeve"/g), 1);
  assert.equal(count(/data-outfit-slot="tail"/g), 1);
  assert.equal(count(/data-outfit-slot="boots"/g), 2);
});
