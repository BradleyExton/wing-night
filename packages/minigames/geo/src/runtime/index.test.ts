import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION } from "@wingnight/shared";

import { geoMinigameId, geoMinigameMetadata } from "./index.js";

test("geo runtime metadata advertises expected API version", () => {
  assert.equal(geoMinigameId, "GEO");
  assert.equal(geoMinigameMetadata.minigameApiVersion, MINIGAME_API_VERSION);
});
