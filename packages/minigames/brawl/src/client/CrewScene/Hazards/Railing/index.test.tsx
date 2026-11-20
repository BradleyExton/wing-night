import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { STREET_BANDS } from "../../Backdrop/layout/index.js";
import { brawlNight } from "../../palette.js";
import { Railing } from "./index.js";

const render = (x: number, width: number): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 192 108">
      <Railing x={x} width={width} palette={brawlNight} />
    </svg>
  );

test("does stand as a bare g carrying its hazard kind, painted only in the night's custom properties", () => {
  const html = render(100, 24);

  assert.match(html, /^<svg viewBox="0 0 192 108"><g data-brawl-hazard="railing" aria-hidden="true">/);
  assert.equal((html.match(/<svg/g) ?? []).length, 1);
  assert.match(html, /fill="var\(--bn-steel\)"/);
  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=|class=/);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
});

test("does lay the patio's deck across the whole depth of the band, so a shove meets it on any line", () => {
  const { bandBackY, bandFrontY } = STREET_BANDS;
  const deck = /<rect x="100" y="([\d.]+)" width="24" height="([\d.]+)" fill="var\(--bn-plank\)"/.exec(render(100, 24));

  assert.ok(deck !== null, "no deck");
  assert.ok(Number(deck[1]) <= bandBackY, "the deck starts in front of the band's back");
  assert.ok(Number(deck[1]) + Number(deck[2]) >= bandFrontY, "the deck stops short of the band's front");
});

test("does run more posts across a wider span, from its left edge", () => {
  const posts = (html: string): number => (html.match(/<circle /g) ?? []).length;

  assert.ok(posts(render(100, 48)) > posts(render(100, 24)));
  assert.match(render(100, 24), /<rect x="100" y="[\d.]+" width="24" height="0.5" fill="var\(--bn-steel\)"/, "the mid rail runs the span");
});

test("does stay finite when handed an edge or a width that is not a number", () => {
  assert.doesNotMatch(render(Number.NaN, Number.NaN), /NaN|Infinity/);
});
