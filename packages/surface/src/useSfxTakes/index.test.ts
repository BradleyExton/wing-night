import assert from "node:assert/strict";
import test from "node:test";

import { resolveSfxTakeUrls } from "./index.js";

const LISTING_URL = "http://192.168.1.20:3000/sfx-takes/joust";

test("does resolve each take against the listing's origin when the listing is well formed", () => {
  assert.deepEqual(
    resolveSfxTakeUrls(
      { takes: { topple: ["/content-assets/sfx/joust/topple-1.mp3", "/content-assets/sfx/joust/topple-2.mp3"] } },
      LISTING_URL
    ),
    {
      topple: [
        "http://192.168.1.20:3000/content-assets/sfx/joust/topple-1.mp3",
        "http://192.168.1.20:3000/content-assets/sfx/joust/topple-2.mp3"
      ]
    }
  );
});

test("does answer no takes when the listing is not the listing's shape", () => {
  assert.deepEqual(resolveSfxTakeUrls(null, LISTING_URL), {});
  assert.deepEqual(resolveSfxTakeUrls({ error: "Unknown game." }, LISTING_URL), {});
  assert.deepEqual(resolveSfxTakeUrls({ takes: "topple.mp3" }, LISTING_URL), {});
});

test("does skip the entries that are not paths when a cue mixes them in", () => {
  assert.deepEqual(
    resolveSfxTakeUrls({ takes: { topple: [7, "/content-assets/sfx/joust/topple-1.mp3"], creak: "no" } }, LISTING_URL),
    { topple: ["http://192.168.1.20:3000/content-assets/sfx/joust/topple-1.mp3"] }
  );
});
