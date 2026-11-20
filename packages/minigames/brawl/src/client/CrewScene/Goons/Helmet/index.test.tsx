import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { BRAWL_WORLD, type BrawlGoonState } from "@wingnight/shared";

import { Goose } from "../Goose/index.js";
import { brawlGoonPalette } from "../palette.js";
import { HELMET_ART_HEIGHT, Helmet } from "./index.js";

const STATES: BrawlGoonState[] = ["entering", "approach", "telegraph", "attack", "recover", "stunned", "ko", "gone"];
const ARMOURED: BrawlGoonState[] = ["entering", "approach", "stunned"];
const OPEN: BrawlGoonState[] = ["telegraph", "attack", "recover"];

const render = (state: BrawlGoonState, overrides: Partial<{ x: number; y: number; facing: -1 | 1; tick: number }> = {}): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Helmet x={overrides.x ?? 80} y={overrides.y ?? 0} facing={overrides.facing ?? 1} state={state} tick={overrides.tick ?? 37} palette={brawlGoonPalette} />
    </svg>
  );

test("does draw every state as a bare g carrying its kind and state", () => {
  for (const state of STATES) {
    const html = render(state);

    assert.match(html, /^<svg viewBox="0 0 160 90"><g /, `${state} is a <g> straight inside the svg`);
    assert.equal((html.match(/<svg/g) ?? []).length, 1, `${state} brings no svg of its own`);
    assert.match(html, new RegExp(`<g [^>]*data-brawl-goon-kind="helmet" data-brawl-goon-state="${state}"`), state);
    assert.doesNotMatch(html, /NaN|Infinity|undefined/, `${state} has only finite numbers`);
  }
});

test("does stay finite when the frame hands it a tick or a position that is not a number", () => {
  for (const state of STATES) {
    assert.doesNotMatch(render(state, { x: Number.NaN, y: Number.NaN, tick: Number.NaN }), /NaN|Infinity/, state);
  }
});

test("does draw nothing inside the root when the helmet goose is gone", () => {
  assert.match(render("gone"), /data-brawl-goon-state="gone" transform="[^"]*"><\/g><\/svg>$/);
});

test("does stand in the goose's own box, placed exactly as the goose is", () => {
  assert.equal(BRAWL_WORLD.goons.helmet.height, BRAWL_WORLD.goons.goose.height);

  const goose = renderToStaticMarkup(
    <svg>
      <Goose x={42} y={0} facing={-1} state="approach" tick={0} palette={brawlGoonPalette} />
    </svg>
  );
  const transform = (html: string): string => html.match(/transform="([^"]*)"/)?.[1] ?? "";

  assert.equal(transform(render("approach", { x: 42, facing: -1, tick: 0 })), transform(goose));
  assert.equal(HELMET_ART_HEIGHT > 0, true);
});

test("does wear the cage down while armoured and flipped up while open, so the room can tell the two modes", () => {
  for (const state of ARMOURED) {
    assert.match(render(state), /data-brawl-goon-guard="down"/, `${state} is armoured`);
    assert.match(render(state), /data-brawl-helmet-cage="down"/, `${state} wears the cage down`);
  }

  for (const state of OPEN) {
    assert.match(render(state), /data-brawl-goon-guard="up"/, `${state} is open`);
    assert.match(render(state), /data-brawl-helmet-cage="up"/, `${state} wears the cage up`);
  }
});

test("does knock the helmet off onto the street beside it when it is out", () => {
  const html = render("ko");

  assert.match(html, /data-brawl-goon-guard="off"/);
  assert.match(html, /data-brawl-helmet-off/);
  assert.equal((html.match(/data-brawl-helmet-cage=/g) ?? []).length, 1, "the one helmet drawn is the one on the ground");
});

test("does keep its head lower while armoured than the open honk holds it", () => {
  const headY = (html: string): number => {
    const heads = [...html.matchAll(/<ellipse class="[^"]*" cx="0" cy="0" rx="1.3" ry="1.05"/g)];
    const before = html.slice(0, heads[0]?.index ?? 0);
    const translate = [...before.matchAll(/translate\((-?[\d.]+) (-?[\d.]+)\) rotate\(/g)].at(-1);

    return Number(translate?.[2]);
  };

  assert.ok(headY(render("approach")) > headY(render("telegraph")), "the armoured head is lower on the screen (a larger y)");
});

test("does swap the walking legs between frames when entering or approaching", () => {
  for (const state of ["entering", "approach"] as const) {
    assert.notEqual(render(state, { tick: 0 }), render(state, { tick: 8 }), state);
  }
});

test("does honk when telegraphing, and only then", () => {
  for (const state of STATES) {
    assert.equal(render(state).includes("data-brawl-goon-honk"), state === "telegraph", state);
  }
});

test("does see stars when stunned or knocked out, and only then", () => {
  for (const state of STATES) {
    assert.equal(render(state).includes("data-brawl-goon-stars"), state === "stunned" || state === "ko", state);
  }
});

test("does paint with the palette's classes and never a hex", () => {
  for (const state of STATES) {
    assert.doesNotMatch(render(state), /#[0-9a-fA-F]{3,6}\b|style=/, state);
  }
});
