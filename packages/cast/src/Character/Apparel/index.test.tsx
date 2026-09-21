import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CHARACTER_APPARELS } from "../../resolveTeamApparel/index.js";
import { DRAWN_HEAD_ANCHORS } from "../geometry/index.js";
import { Apparel } from "./index.js";

test("does render a tagged group for every apparel kind when placed on a head", () => {
  for (const apparel of CHARACTER_APPARELS) {
    const html = renderToStaticMarkup(<Apparel apparel={apparel} head={DRAWN_HEAD_ANCHORS} />);

    assert.match(html, new RegExp(`data-character-apparel="${apparel}"`));
    assert.match(html, /<path/);
  }
});

test("does keep the hat band in the team colour when drawn", () => {
  const hat = renderToStaticMarkup(<Apparel apparel="hat" head={DRAWN_HEAD_ANCHORS} />);

  assert.match(hat, /<rect class="fill-current"/);
});

test("does put the shades on the eye line when placed on a head", () => {
  const html = renderToStaticMarkup(<Apparel apparel="shades" head={{ ...DRAWN_HEAD_ANCHORS, eyeY: 18 }} />);

  assert.match(html, /d="M 53\.0 12\.5 /);
});
