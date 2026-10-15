import assert from "node:assert/strict";
import test from "node:test";
import { MINIGAME_TYPES } from "@wingnight/shared";

import { resolveMinigameDevManifest, resolveMinigameRuntimePlugin } from "./index";

test("does resolve a dev manifest for every minigame type", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.ok(resolveMinigameDevManifest(minigameType));
  }
});

test("does resolve the runtime plugin matching each minigame type", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.equal(resolveMinigameRuntimePlugin(minigameType)?.id, minigameType);
  }
});
