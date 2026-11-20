import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { STREET_BANDS } from "../../Backdrop/layout/index.js";
import { brawlNight } from "../../palette.js";
import { Plinth } from "./index.js";

const render = (x: number, width: number): string =>
  renderToStaticMarkup(
    <svg viewBox="0 0 192 108">
      <Plinth x={x} width={width} palette={brawlNight} />
    </svg>
  );

test("does stand as a bare g carrying its hazard kind, painted only in the night's custom properties", () => {
  const html = render(100, 24);

  assert.match(html, /^<svg viewBox="0 0 192 108"><g data-brawl-hazard="plinth" aria-hidden="true">/);
  assert.equal((html.match(/<svg/g) ?? []).length, 1);
  assert.match(html, /fill="var\(--bn-mound\)"/, "the dark front face");
  assert.match(html, /fill="var\(--bn-kerb\)"/, "the lighter top face");
  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,6}\b|style=|class=/);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
});

test("does lay its top face the whole span wide and the whole depth of the band", () => {
  const { bandBackY, bandFrontY } = STREET_BANDS;
  const top = /<rect x="100" y="([\d.]+)" width="(\d+)" height="([\d.]+)" fill="var\(--bn-kerb\)"/.exec(render(100, 48));

  assert.ok(top !== null, "no top face");
  assert.equal(top[2], "48");
  assert.ok(Number(top[1]) <= bandBackY);
  assert.ok(Number(top[1]) + Number(top[3]) >= bandFrontY);
});

test("does stay finite when handed an edge or a width that is not a number", () => {
  assert.doesNotMatch(render(Number.NaN, Number.NaN), /NaN|Infinity/);
});
