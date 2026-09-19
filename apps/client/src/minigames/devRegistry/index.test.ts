import assert from "node:assert/strict";
import test from "node:test";
import { MINIGAME_TYPES } from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRuntimePlugin
} from "./index";

test("does resolve a dev manifest when the sandbox names any minigame type", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.ok(resolveMinigameDevManifest(minigameType));
  }
});

test("does resolve a runtime plugin whose id matches when the sandbox names any minigame type", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.equal(resolveMinigameRuntimePlugin(minigameType)?.id, minigameType);
  }
});
