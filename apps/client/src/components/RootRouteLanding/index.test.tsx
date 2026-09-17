import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RootRouteLanding } from "./index";

test("renders role picker landing with shared logo and hero image", () => {
  const html = renderToStaticMarkup(<RootRouteLanding />);

  assert.match(html, /Pick Your Screen/);
  assert.match(html, /Choose where this device should go:/);
  assert.match(html, /Host Controller/);
  assert.match(html, /Display Board/);
  assert.match(html, /href="\/host"/);
  assert.match(html, /href="\/display"/);
  assert.match(html, /src="\/favicon\.svg"/);
  assert.match(html, /src="\/display\/setup\/hero\.png"/);
});

// The role picker is what a guest gets handed on party night, so the dev
// launcher is one muted link rather than a third card.
test("links the dev launcher without adding a third role card", () => {
  const html = renderToStaticMarkup(<RootRouteLanding />);

  assert.match(html, /href="\/dev"/);
  assert.match(html, /Dev tools/);
  assert.equal(html.match(/class="group relative overflow-hidden/g)?.length, 2);
});
