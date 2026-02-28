import assert from "node:assert/strict";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { RouteNotFound } from "./index";

test("renders 404 recovery links", () => {
  const html = renderToStaticMarkup(<RouteNotFound />);

  assert.match(html, /404 - Page Not Found/);
  assert.match(html, /href="\/"/);
  assert.match(html, /Back to Landing/);
  assert.match(html, /href="\/host"/);
  assert.match(html, /Open Host Controls/);
  assert.match(html, /href="\/display"/);
  assert.match(html, /Open Display Board/);
});
