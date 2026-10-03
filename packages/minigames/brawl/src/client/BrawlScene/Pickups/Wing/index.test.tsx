import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { BRAWL_WORLD } from "@wingnight/shared";

import { brawlGoonPalette } from "../../Goons/palette.js";
import { WING_ART_HEIGHT, Wing } from "./index.js";
import { brawlWingPalette } from "./palette.js";

const render = (overrides: Partial<{ x: number; y: number; tick: number; sauce: string }> = {}): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Wing
        x={overrides.x ?? 80}
        y={overrides.y ?? 0}
        tick={overrides.tick ?? 37}
        palette={overrides.sauce === undefined ? brawlGoonPalette : { ...brawlGoonPalette, sauce: overrides.sauce }}
      />
    </svg>
  );

test("does lie on the pavement as a bare g carrying its pickup kind, stood on the ground line", () => {
  const html = render({ x: 42, y: 0 });

  assert.match(html, /^<svg viewBox="0 0 160 90"><g [^>]*data-brawl-pickup="wing" transform="translate\(42 70\)"/);
  assert.equal((html.match(/<svg/g) ?? []).length, 1);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
  assert.equal(BRAWL_WORLD.groundY, 70);
  assert.ok(WING_ART_HEIGHT < BRAWL_WORLD.goons.goose.height, "smaller than the goose that dropped it");
});

test("does bob and glint with the tick so both screens draw the same wing, and never the same frame twice in a row", () => {
  assert.equal(render({ tick: 12 }), render({ tick: 12 }));
  assert.notEqual(render({ tick: 12 }), render({ tick: 24 }));
});

test("does stay finite when the frame hands it a tick or a position that is not a number", () => {
  assert.doesNotMatch(render({ x: Number.NaN, y: Number.NaN, tick: Number.NaN }), /NaN|Infinity/);
});

test("does paint with the palette's classes and never a hex, in the wing's own colours from the merged palette", () => {
  const html = render();

  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=/);
  assert.match(html, new RegExp(brawlWingPalette.sauce));
  assert.match(html, new RegExp(brawlWingPalette.bone));
  assert.match(html, new RegExp(brawlGoonPalette.shadow.replace("/", "\\/")));
});

test("does take its sauce colour from the palette it is handed", () => {
  const html = render({ sauce: "fill-heat" });

  assert.match(html, /fill-heat/);
  assert.doesNotMatch(html, new RegExp(`${brawlWingPalette.sauce}(?![A-Za-z])`));
});
