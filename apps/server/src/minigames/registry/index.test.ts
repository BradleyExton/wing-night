import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_TYPES } from "@wingnight/shared";

import { resolveMinigameRuntimePlugin } from "./index.js";

test("resolveMinigameRuntimePlugin resolves runtime plugin for each minigame", () => {
  for (const minigameType of MINIGAME_TYPES) {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);
    assert.equal(runtimePlugin.id, minigameType);
  }
});

test("server runtime registry covers every shared minigame definition", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.doesNotThrow(() => {
      resolveMinigameRuntimePlugin(minigameType);
    });
  }
});
