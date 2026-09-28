import assert from "node:assert/strict";
import test from "node:test";

import { resolveSfxTakesUrl } from "./index.js";

test("does address the listing against the server origin when the origin is known", () => {
  assert.equal(
    resolveSfxTakesUrl("joust", "http://192.168.1.20:3000"),
    "http://192.168.1.20:3000/sfx-takes/joust"
  );
});

test("does return null when the server origin is not known yet", () => {
  assert.equal(resolveSfxTakesUrl("joust", null), null);
  assert.equal(resolveSfxTakesUrl("joust", "  "), null);
});
