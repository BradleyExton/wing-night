import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_ACTION_TYPES } from "@wingnight/shared";

import { getMinigameRegistryDescriptor } from "./index.js";

test("returns trivia registry descriptor with runtime adapter metadata and capabilities", () => {
  const descriptor = getMinigameRegistryDescriptor("TRIVIA");

  assert.equal(descriptor.minigameId, "TRIVIA");
  assert.equal(descriptor.minigameApiVersion, 1);
  assert.deepEqual(descriptor.capabilityFlags, [
    MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT
  ]);
  assert.equal(descriptor.hasRuntimeAdapter, true);
  assert.notEqual(descriptor.runtimeAdapter, null);
});

test("returns geo descriptor as registry-known without runtime adapter", () => {
  const descriptor = getMinigameRegistryDescriptor("GEO");

  assert.equal(descriptor.minigameId, "GEO");
  assert.equal(descriptor.minigameApiVersion, 1);
  assert.deepEqual(descriptor.capabilityFlags, []);
  assert.equal(descriptor.hasRuntimeAdapter, false);
  assert.equal(descriptor.runtimeAdapter, null);
});
