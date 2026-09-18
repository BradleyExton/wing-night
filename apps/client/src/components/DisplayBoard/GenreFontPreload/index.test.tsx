import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { GenreFontPreload } from "./index";

test("does emit one font preload per genre face on the roster", () => {
  const html = renderToStaticMarkup(
    <GenreFontPreload teams={[{ genre: "metal" }, { genre: "pop" }, { genre: "heavy metal" }, {}]} />
  );

  assert.equal((html.match(/data-genre-font-preload/g) ?? []).length, 2);
  assert.match(html, /rel="preload"[^>]*as="font"[^>]*href="\/fonts\/metal-mania\/metal-mania-latin\.woff2"[^>]*crossorigin="anonymous"/);
  assert.match(html, /href="\/fonts\/fredoka\/fredoka-700-latin\.woff2"/);
});

test("does emit nothing when no team has a genre", () => {
  assert.equal(renderToStaticMarkup(<GenreFontPreload teams={[{}, {}]} />), "");
});
