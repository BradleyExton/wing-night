import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PhoneGameFrame } from "./index";

test("does carry the rotate card and lay out no canvas when it has not measured the phone yet", () => {
  const html = renderToStaticMarkup(
    <PhoneGameFrame>
      <span data-game />
    </PhoneGameFrame>
  );

  assert.match(html, /data-phone-rotate/);
  assert.match(html, /Turn your phone sideways/);
  assert.match(html, /portrait:flex/);
  // The canvas is sized from the screen in an effect, so the first paint draws no game into a
  // box of the wrong shape.
  assert.doesNotMatch(html, /data-game/);
});
