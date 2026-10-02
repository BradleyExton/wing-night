import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { brawlNight } from "../../palette.js";
import { Railing } from "./index.js";

const render = (x: number, width: number): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Railing x={x} width={width} palette={brawlNight} />
    </svg>
  );

test("does stand as a bare g carrying its hazard kind, painted only in the night's custom properties", () => {
  const html = render(100, 24);

  assert.match(html, /^<svg viewBox="0 0 160 90"><g data-brawl-hazard="railing" aria-hidden="true">/);
  assert.equal((html.match(/<svg/g) ?? []).length, 1);
  assert.match(html, /fill="var\(--bn-steel\)"/);
  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=|class=/);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
});

test("does run more posts across a wider span, from its left edge", () => {
  const posts = (html: string): number => (html.match(/<circle /g) ?? []).length;

  assert.ok(posts(render(100, 48)) > posts(render(100, 24)));
  assert.match(render(100, 24), /<rect x="100" y="64.6" width="24"/, "the mid rail runs the span");
});

test("does stay finite when handed an edge or a width that is not a number", () => {
  assert.doesNotMatch(render(Number.NaN, Number.NaN), /NaN|Infinity/);
});
