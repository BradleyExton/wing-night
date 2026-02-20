import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION } from "@wingnight/shared";

import { drawingMinigameId, drawingMinigameMetadata } from "./index.js";

test("drawing runtime metadata advertises expected API version", () => {
  assert.equal(drawingMinigameId, "DRAWING");
  assert.equal(drawingMinigameMetadata.minigameApiVersion, MINIGAME_API_VERSION);
});
