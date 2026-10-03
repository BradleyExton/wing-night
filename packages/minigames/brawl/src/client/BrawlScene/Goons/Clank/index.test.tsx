import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { brawlGoonPalette } from "../palette.js";
import { CLANK_TICKS, Clank } from "./index.js";

const render = (tick: number, x = 80, y = 60): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Clank x={x} y={y} tick={tick} palette={brawlGoonPalette} />
    </svg>
  );

const opacity = (html: string): number => Number(html.match(/opacity="([\d.]+)"/)?.[1]);

test("does burst as a bare g carrying its mark on the first tick of the bounce", () => {
  const html = render(0);

  assert.match(html, /^<svg viewBox="0 0 160 90"><g data-brawl-goon-clank/);
  assert.equal((html.match(/<path/g) ?? []).length, 2, "a jag and the strokes");
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
});

test("does grow and fade as it ages, and draw nothing once its ticks are spent", () => {
  assert.ok(opacity(render(0)) > opacity(render(6)), "fades");
  assert.ok(opacity(render(6)) > opacity(render(CLANK_TICKS - 1)), "keeps fading");
  assert.notEqual(render(0).match(/scale\(([\d.]+)\)/)?.[1], render(6).match(/scale\(([\d.]+)\)/)?.[1], "grows");
  assert.equal(render(CLANK_TICKS), '<svg viewBox="0 0 160 90"></svg>');
  assert.equal(render(CLANK_TICKS + 40), '<svg viewBox="0 0 160 90"></svg>');
});

test("does draw the same spark on both screens when handed the same age", () => {
  assert.equal(render(4), render(4));
  assert.notEqual(render(4), render(5));
});

test("does stay finite when the frame hands it an age or a point that is not a number", () => {
  assert.doesNotMatch(render(Number.NaN, Number.NaN, Number.NaN), /NaN|Infinity/);
});

test("does paint with the palette's classes and never a hex or a style", () => {
  const html = render(3);

  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=/);
  assert.match(html, new RegExp(brawlGoonPalette.mark));
  assert.match(html, new RegExp(brawlGoonPalette.stars));
});
