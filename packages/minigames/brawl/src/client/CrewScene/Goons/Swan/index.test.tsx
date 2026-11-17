import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { BRAWL_WORLD } from "@wingnight/shared";

import { brawlGoonPalette } from "../palette.js";
import { SWAN_ART_HEIGHT, Swan } from "./index.js";
import { brawlSwanPalette } from "./palette.js";
import type { SwanState } from "./pose/index.js";

const STATES: SwanState[] = ["entering", "approach", "stalk", "telegraph", "attack", "recover", "stunned", "ko", "gone"];

const render = (state: SwanState, overrides: Partial<{ x: number; y: number; facing: -1 | 1; tick: number; swanLegs: string }> = {}): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Swan
        x={overrides.x ?? 80}
        y={overrides.y ?? 0}
        facing={overrides.facing ?? 1}
        state={state}
        tick={overrides.tick ?? 37}
        palette={overrides.swanLegs === undefined ? brawlGoonPalette : { ...brawlGoonPalette, swanLegs: overrides.swanLegs }}
      />
    </svg>
  );

test("does draw every state, the stalk included, as a bare g carrying its kind and state", () => {
  for (const state of STATES) {
    const html = render(state);

    assert.match(html, /^<svg viewBox="0 0 160 90"><g /, `${state} is a <g> straight inside the svg`);
    assert.equal((html.match(/<svg/g) ?? []).length, 1, `${state} brings no svg of its own`);
    assert.match(html, new RegExp(`<g [^>]*data-brawl-goon-kind="swan" data-brawl-goon-state="${state}"`), state);
    assert.doesNotMatch(html, /NaN|Infinity|undefined/, `${state} has only finite numbers`);
  }
});

test("does stay finite when the frame hands it a tick or a position that is not a number", () => {
  for (const state of STATES) {
    assert.doesNotMatch(render(state, { x: Number.NaN, y: Number.NaN, tick: Number.NaN }), /NaN|Infinity/, state);
  }
});

test("does draw nothing inside the root when the swan is gone", () => {
  assert.match(render("gone"), /data-brawl-goon-state="gone" transform="[^"]*"><\/g><\/svg>$/);
});

test("does stand on the ground line scaled from its art height to its own box, flipped to its facing", () => {
  const scale = Math.round((BRAWL_WORLD.goons.swan.height / SWAN_ART_HEIGHT) * 100) / 100;

  assert.match(render("approach", { x: 42 }), new RegExp(`transform="translate\\(42 ${BRAWL_WORLD.groundY}\\) scale\\(${scale} ${scale}\\)"`));
  assert.match(render("approach", { x: 42, facing: -1 }), new RegExp(`scale\\(-${scale} ${scale}\\)`));
});

test("does draw a taller box than the goose's, so the swan is the bigger bird on the street", () => {
  assert.ok(BRAWL_WORLD.goons.swan.height > BRAWL_WORLD.goons.goose.height);
});

test("does swap the walking legs between frames when entering or approaching, and hold still when stalking", () => {
  assert.notEqual(render("entering", { tick: 0 }), render("entering", { tick: 8 }));
  assert.notEqual(render("approach", { tick: 0 }), render("approach", { tick: 8 }));
  assert.equal(render("stalk", { tick: 0 }), render("stalk", { tick: 8 }));
});

test("does draw the stalk as its own pose, unlike the walk it stalled out of", () => {
  assert.notEqual(render("stalk"), render("approach"));
});

test("does hiss when telegraphing, counted as a honk, and only then", () => {
  for (const state of STATES) {
    const html = render(state);

    assert.equal(html.includes("data-brawl-goon-hiss"), state === "telegraph", `${state} hisses`);
    assert.equal(html.includes("data-brawl-goon-honk"), state === "telegraph", `${state} counts as a honk`);
  }
});

test("does see stars when stunned or knocked out, and only then", () => {
  for (const state of STATES) {
    assert.equal(render(state).includes("data-brawl-goon-stars"), state === "stunned" || state === "ko", state);
  }
});

test("does paint white with the palette's classes and never a hex, on the swan's own legs from the merged palette", () => {
  for (const state of STATES) {
    const html = render(state);

    assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=/, state);

    if (state !== "gone") {
      assert.match(html, new RegExp(brawlGoonPalette.plumage), `${state} is white`);
      assert.match(html, new RegExp(brawlSwanPalette.swanLegs), `${state} stands on the swan's legs`);
    }
  }
});

test("does take its leg colour from the palette it is handed", () => {
  const html = render("approach", { swanLegs: "stroke-gold" });

  assert.match(html, /stroke-gold/);
  assert.doesNotMatch(html, new RegExp(`${brawlSwanPalette.swanLegs}(?![A-Za-z])`));
});
