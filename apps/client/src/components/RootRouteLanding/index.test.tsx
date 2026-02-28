import assert from "node:assert/strict";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { RootRouteLanding } from "./index";

test("renders host and display route links on root landing", () => {
  const html = renderToStaticMarkup(<RootRouteLanding />);

  assert.match(html, /Choose Your Screen/);
  assert.match(html, /href="\/host"/);
  assert.match(html, /Open Host Controls/);
  assert.match(html, /href="\/display"/);
  assert.match(html, /Open Display Board/);
});
