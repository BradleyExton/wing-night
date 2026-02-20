import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION } from "@wingnight/shared";

import { resolveMinigameDescriptor, resolveMinigameModule } from "./index.js";

test("resolveMinigameModule returns trivia module for TRIVIA", () => {
  const module = resolveMinigameModule("TRIVIA");

  assert.ok(module);
  assert.equal(module?.id, "TRIVIA");
});

test("resolveMinigameModule returns null for unimplemented minigames", () => {
  assert.equal(resolveMinigameModule("GEO"), null);
  assert.equal(resolveMinigameModule("DRAWING"), null);
});

test("resolveMinigameDescriptor exposes metadata for compatibility checks", () => {
  const triviaDescriptor = resolveMinigameDescriptor("TRIVIA");
  const geoDescriptor = resolveMinigameDescriptor("GEO");

  assert.equal(triviaDescriptor.metadata.minigameApiVersion, MINIGAME_API_VERSION);
  assert.equal(geoDescriptor.metadata.minigameApiVersion, MINIGAME_API_VERSION);
});
