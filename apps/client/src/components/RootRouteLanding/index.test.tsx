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
// launcher is one muted link rather than a role card. Quick Play IS a card:
// it is a way to run the room, not a tool for working on it.
test("links the dev launcher without adding a role card for it", () => {
  const html = renderToStaticMarkup(<RootRouteLanding />);

  assert.match(html, /href="\/dev"/);
  assert.match(html, /Dev tools/);
  assert.match(html, /href="\/quickplay"/);
  assert.match(html, /Quick Play/);
  assert.equal(html.match(/class="group relative overflow-hidden/g)?.length, 3);
});
