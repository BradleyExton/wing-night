import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { brawlNight } from "../../palette.js";
import { Plinth } from "./index.js";

const render = (x: number, width: number): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 160 90">
      <Plinth x={x} width={width} palette={brawlNight} />
    </svg>
  );

test("does stand as a bare g carrying its hazard kind, painted only in the night's custom properties", () => {
  const html = render(100, 24);

  assert.match(html, /^<svg viewBox="0 0 160 90"><g data-brawl-hazard="plinth" aria-hidden="true">/);
  assert.equal((html.match(/<svg/g) ?? []).length, 1);
  assert.match(html, /fill="var\(--bn-mound\)"/, "the dark front face");
  assert.match(html, /fill="var\(--bn-kerb\)"/, "the lighter top face");
  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=|class=/);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
});

test("does rise off the ground line the whole span wide", () => {
  assert.match(render(100, 24), /<rect x="100" y="65" width="24" height="5" fill="var\(--bn-mound\)"/);
  assert.match(render(100, 48), /<rect x="100" y="65" width="48" height="5"/);
});

test("does stay finite when handed an edge or a width that is not a number", () => {
  assert.doesNotMatch(render(Number.NaN, Number.NaN), /NaN|Infinity/);
});
