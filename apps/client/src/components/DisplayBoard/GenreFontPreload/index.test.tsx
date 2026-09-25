import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { GenreFontPreload } from "./index";

test("does emit one font preload per genre face on the roster, plus the four chrome faces", () => {
  const html = renderToStaticMarkup(
    <GenreFontPreload teams={[{ genre: "metal" }, { genre: "pop" }, { genre: "heavy metal" }, {}]} />
  );

  assert.equal((html.match(/data-genre-font-preload/g) ?? []).length, 6);
  assert.match(html, /href="\/fonts\/monoton\/monoton-latin\.woff2"/);
  assert.match(html, /href="\/fonts\/barlow-condensed\/barlow-condensed-800-latin\.woff2"/);
  assert.match(html, /href="\/fonts\/anton\/anton-latin\.woff2"/);
  assert.match(html, /rel="preload"[^>]*as="font"[^>]*href="\/fonts\/metal-mania\/metal-mania-latin\.woff2"[^>]*crossorigin="anonymous"/);
  assert.match(html, /href="\/fonts\/fredoka\/fredoka-700-latin\.woff2"/);
});

// The marquee wears Monoton and Anton on every game (DESIGN.md §2.2D) and every
// clock and score is in the score face (§4), so a roster with no genres still
// preloads exactly the four chrome faces and nothing else.
test("does emit only the chrome faces when no team has a genre", () => {
  const html = renderToStaticMarkup(<GenreFontPreload teams={[{}, {}]} />);

  assert.equal((html.match(/data-genre-font-preload/g) ?? []).length, 4);
  assert.doesNotMatch(html, /metal-mania|fredoka|rye/);
});

// A disco team on the roster does not preload Monoton twice.
test("does not repeat a face the roster and the marquee share", () => {
  const html = renderToStaticMarkup(<GenreFontPreload teams={[{ genre: "disco" }]} />);

  assert.equal((html.match(/monoton-latin/g) ?? []).length, 1);
});
