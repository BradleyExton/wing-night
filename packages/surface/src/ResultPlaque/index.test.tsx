import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { revealPoints } from "../styleTokens/index.js";
import { ResultPlaque, type ResultPlaqueProps } from "./index.js";

const render = (props: Partial<ResultPlaqueProps> = {}): string =>
  renderToStaticMarkup(createElement(ResultPlaque, { tone: "hit", title: "3 down!", ...props }));

test("does mark a hit with a tick and a miss with a cross, not colour alone", () => {
  assert.match(render({ tone: "hit" }), /✓/);
  assert.match(render({ tone: "miss" }), /✗/);
  assert.doesNotMatch(render({ tone: "neutral" }), /✓|✗/);
});

test("does expose the tone on one hook the game's own wrapper can sit around", () => {
  assert.match(render({ tone: "miss" }), /data-result-plaque="miss"/);
});

test("does render kicker, title and detail in reading order", () => {
  const html = render({ kicker: "The answer was", title: "Campfire", detail: "Team Alpha" });

  assert.match(html, /The answer was[\s\S]*Campfire[\s\S]*Team Alpha/);
});

test("does draw the points in the house reveal face and only when there are some", () => {
  assert.ok(render({ points: "+3" }).includes(`class="${revealPoints}">+3<`));
  assert.doesNotMatch(render(), /tabular-nums/);
});

test("does put what follows the result on the same card, under a rule", () => {
  const html = render({ children: createElement("span", null, "Caitlin — you're up") });

  assert.match(html, /border-t[\s\S]*Caitlin — you&#x27;re up/);
});
