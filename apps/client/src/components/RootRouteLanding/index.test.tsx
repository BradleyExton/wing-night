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
