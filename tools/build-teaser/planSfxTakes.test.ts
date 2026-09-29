import assert from "node:assert/strict";
import { test } from "node:test";

import { planSfxTakes } from "./planSfxTakes.ts";

test("groups takes by the cue before the first dash, as the server's listing does", () => {
  const { listing } = planSfxTakes("schlonic", ["hit-2.mp3", "hit-1.mp3", "pop.wav", "wing-big hit.mp3"]);

  assert.deepEqual(listing.takes, {
    hit: ["/content-assets/sfx/schlonic/hit-1.mp3", "/content-assets/sfx/schlonic/hit-2.mp3"],
    pop: ["/content-assets/sfx/schlonic/pop.wav"],
    wing: ["/content-assets/sfx/schlonic/wing-big%20hit.mp3"]
  });
});

test("copies only the files it lists", () => {
  const { fileNames } = planSfxTakes("schlonic", ["hit-1.mp3", ".DS_Store", "notes.txt", "-1.mp3"]);

  assert.deepEqual(fileNames, ["hit-1.mp3"]);
});
