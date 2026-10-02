import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { BRAWL_WORLD, type BrawlGoonKind, type BrawlGoonState } from "@wingnight/shared";

import { CLANK_TICKS, Goon, brawlGoonPalette } from "./index.js";

const KINDS: BrawlGoonKind[] = ["goose", "gull", "raccoon", "swan", "helmet", "boss"];
const STATES: BrawlGoonState[] = ["entering", "approach", "stalk", "telegraph", "attack", "recover", "stunned", "ko", "gone"];

const render = (
  kind: BrawlGoonKind,
  state: BrawlGoonState,
  overrides: Partial<{ x: number; y: number; facing: -1 | 1; tick: number; clank: number | null }> = {}
): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Goon
        kind={kind}
        x={overrides.x ?? 80}
        y={overrides.y ?? (kind === "gull" ? 20 : 0)}
        facing={overrides.facing ?? 1}
        state={state}
        tick={overrides.tick ?? 37}
        palette={brawlGoonPalette}
        clank={overrides.clank ?? null}
      />
    </svg>
  );

test("does draw every kind in every state as a bare g inside the scene's svg, carrying its kind and state", () => {
  for (const kind of KINDS) {
    for (const state of STATES) {
      const html = render(kind, state);

      assert.match(html, /^<svg viewBox="0 0 160 90"><g /, `${kind}/${state} is a <g> straight inside the svg`);
      assert.equal((html.match(/<svg/g) ?? []).length, 1, `${kind}/${state} brings no svg of its own`);
      assert.match(html, new RegExp(`<g [^>]*data-brawl-goon-kind="${kind}" data-brawl-goon-state="${state}"`), `${kind}/${state}`);
      assert.doesNotMatch(html, /NaN|Infinity|undefined/, `${kind}/${state} has only finite numbers`);
    }
  }
});

test("does stay finite when the frame hands it a tick or a position that is not a number", () => {
  for (const kind of KINDS) {
    for (const state of STATES) {
      const html = render(kind, state, { x: Number.NaN, y: Number.NaN, tick: Number.NaN });

      assert.doesNotMatch(html, /NaN|Infinity/, `${kind}/${state}`);
    }
  }
});

test("does draw nothing inside the root when a goon is gone", () => {
  for (const kind of KINDS) {
    assert.match(render(kind, "gone"), /data-brawl-goon-state="gone" transform="[^"]*"><\/g><\/svg>$/, kind);
  }
});

test("does stand the drawing on the ground line less its height above it, flipped to its facing", () => {
  const { groundY } = BRAWL_WORLD;

  assert.match(render("goose", "approach", { x: 42, facing: 1 }), new RegExp(`transform="translate\\(42 ${groundY}\\) scale\\([\\d.]+ [\\d.]+\\)"`));
  assert.match(render("gull", "approach", { x: 42, y: 25, facing: -1 }), new RegExp(`transform="translate\\(42 ${groundY - 25}\\) scale\\(-[\\d.]+ [\\d.]+\\)"`));
});

test("does draw the boss bigger than the goose it is built on", () => {
  const scale = (html: string): number => Number(html.match(/scale\(([\d.]+) /)?.[1]);

  assert.ok(scale(render("boss", "approach")) > scale(render("goose", "approach")));
});

test("does register the swan and the helmet goose, each drawn as its own bird", () => {
  assert.notEqual(render("swan", "approach").replace(/swan/g, ""), render("goose", "approach").replace(/goose/g, ""));
  assert.match(render("helmet", "approach"), /data-brawl-goon-guard="down"/);
  assert.match(render("helmet", "telegraph"), /data-brawl-goon-guard="up"/);
  assert.match(render("swan", "telegraph"), /data-brawl-goon-hiss/);
});

test("does draw a stalk as a stand only the swan has, and as a walk on any other kind", () => {
  assert.notEqual(render("swan", "stalk"), render("swan", "approach").replace('"approach"', '"stalk"'));

  for (const kind of KINDS.filter((each) => each !== "swan")) {
    assert.equal(render(kind, "stalk"), render(kind, "approach").replace('data-brawl-goon-state="approach"', 'data-brawl-goon-state="stalk"'), kind);
  }
});

test("does burst a clank off the helmet goose's cage while it is fresh, and on no other goon", () => {
  assert.match(render("helmet", "approach", { clank: 0 }), /data-brawl-goon-clank/);
  assert.doesNotMatch(render("helmet", "approach", { clank: CLANK_TICKS }), /data-brawl-goon-clank/);
  assert.doesNotMatch(render("helmet", "approach"), /data-brawl-goon-clank/);

  for (const kind of KINDS.filter((each) => each !== "helmet")) {
    assert.doesNotMatch(render(kind, "approach", { clank: 0 }), /data-brawl-goon-clank/, kind);
  }
});

test("does swap the walking legs between frames when entering or approaching", () => {
  for (const kind of KINDS) {
    for (const state of ["entering", "approach"] as const) {
      assert.notEqual(render(kind, state, { tick: 0 }), render(kind, state, { tick: 8 }), `${kind}/${state} steps`);
    }
  }
});

test("does honk with a mark over its head when telegraphing, and only then", () => {
  for (const kind of KINDS) {
    for (const state of STATES) {
      const honks = render(kind, state).includes("data-brawl-goon-honk");

      assert.equal(honks, state === "telegraph", `${kind}/${state}`);
    }
  }
});

test("does see stars when stunned or knocked out, and only then", () => {
  for (const kind of KINDS) {
    for (const state of STATES) {
      const dazed = render(kind, state).includes("data-brawl-goon-stars");

      assert.equal(dazed, state === "stunned" || state === "ko", `${kind}/${state}`);
    }
  }
});

test("does turn the stars round the head with the tick so the tablet and the TV agree", () => {
  assert.notEqual(render("goose", "ko", { tick: 0 }), render("goose", "ko", { tick: 18 }));
  assert.equal(render("goose", "ko", { tick: 18 }), render("goose", "ko", { tick: 18 }));
});

test("does paint with the palette's classes and never a hex", () => {
  for (const kind of KINDS) {
    for (const state of STATES) {
      assert.doesNotMatch(render(kind, state), /#[0-9a-fA-F]{3,6}\b|style=/, `${kind}/${state}`);
    }
  }
});
