import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { STREET_BANDS } from "../../Backdrop/layout/index.js";
import { brawlNight } from "../../palette.js";
import { BayEdge } from "./index.js";

const render = (x: number, width: number): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <BayEdge x={x} width={width} palette={brawlNight} />
    </svg>
  );

test("does open as a bare g carrying its hazard kind, painted only in the night's custom properties", () => {
  const html = render(100, 24);

  assert.match(html, /^<svg viewBox="0 0 160 90"><g data-brawl-hazard="bay" aria-hidden="true">/);
  assert.equal((html.match(/<svg/g) ?? []).length, 1);
  assert.match(html, /fill="var\(--bn-water\)"/);
  assert.match(html, /fill="var\(--bn-chalk\)"/, "the pale lip");
  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=|class=/);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
});

test("does cut the water the whole span wide, from the boardwalk's top to the bottom of the frame", () => {
  const { boardwalkTop, bottom } = STREET_BANDS;

  assert.match(render(100, 24), new RegExp(`<rect x="100" y="${boardwalkTop}" width="24" height="${bottom - boardwalkTop}" fill="var\\(--bn-water\\)"`));
});

test("does lay the same glints on every call, so both screens see one bay", () => {
  assert.equal(render(100, 24), render(100, 24));
});

test("does stay finite when handed an edge or a width that is not a number", () => {
  assert.doesNotMatch(render(Number.NaN, Number.NaN), /NaN|Infinity/);
});
