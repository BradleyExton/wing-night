import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION } from "@wingnight/shared";

import {
  resolveMinigameDescriptor,
  resolveMinigameRuntimePlugin
} from "./index.js";

test("resolveMinigameRuntimePlugin resolves runtime plugin for each minigame", () => {
  const triviaRuntimePlugin = resolveMinigameRuntimePlugin("TRIVIA");
  const geoRuntimePlugin = resolveMinigameRuntimePlugin("GEO");
  const drawingRuntimePlugin = resolveMinigameRuntimePlugin("DRAWING");

  assert.equal(triviaRuntimePlugin.id, "TRIVIA");
  assert.equal(geoRuntimePlugin.id, "GEO");
  assert.equal(drawingRuntimePlugin.id, "DRAWING");
});

test("resolveMinigameDescriptor exposes metadata for compatibility checks", () => {
  const triviaDescriptor = resolveMinigameDescriptor("TRIVIA");
  const geoDescriptor = resolveMinigameDescriptor("GEO");

  assert.equal(triviaDescriptor.metadata.minigameApiVersion, MINIGAME_API_VERSION);
  assert.equal(geoDescriptor.metadata.minigameApiVersion, MINIGAME_API_VERSION);
  assert.equal(triviaDescriptor.metadata.intro.displayName, "Trivia Sprint");
  assert.ok(triviaDescriptor.metadata.intro.howToPlay.length > 0);
  assert.equal(triviaDescriptor.runtimePlugin.id, "TRIVIA");
});
