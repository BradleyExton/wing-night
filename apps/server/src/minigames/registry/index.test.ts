import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION, MINIGAME_TYPES } from "@wingnight/shared";

import {
  resolveMinigameDescriptor,
  resolveMinigameRuntimePlugin
} from "./index.js";

test("resolveMinigameRuntimePlugin resolves runtime plugin for each minigame", () => {
  for (const minigameType of MINIGAME_TYPES) {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);
    assert.equal(runtimePlugin.id, minigameType);
  }
});

test("resolveMinigameDescriptor exposes metadata for compatibility checks", () => {
  const triviaDescriptor = resolveMinigameDescriptor("TRIVIA");
  const geoDescriptor = resolveMinigameDescriptor("GEO");

  assert.equal(triviaDescriptor.metadata.minigameApiVersion, MINIGAME_API_VERSION);
  assert.equal(geoDescriptor.metadata.minigameApiVersion, MINIGAME_API_VERSION);
  assert.equal(triviaDescriptor.runtimePlugin.id, "TRIVIA");
});

test("server runtime registry covers every shared minigame definition", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.doesNotThrow(() => {
      resolveMinigameRuntimePlugin(minigameType);
    });
  }
});
