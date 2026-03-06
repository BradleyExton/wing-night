import assert from "node:assert/strict";
import test from "node:test";
import {
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPES,
  resolveMinigameTypeFromSlug as resolveSharedMinigameTypeFromSlug
} from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRendererBundle,
  resolveMinigameTypeFromSlug
} from "./index";

test("resolves renderer bundles for all minigame types", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.ok(resolveMinigameRendererBundle(minigameType));
  }
});

test("resolves dev manifests for all minigame types", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.ok(resolveMinigameDevManifest(minigameType));
  }
});

test("maps route slugs to minigame types", () => {
  assert.equal(resolveMinigameTypeFromSlug("trivia"), "TRIVIA");
  assert.equal(resolveMinigameTypeFromSlug("geo"), "GEO");
  assert.equal(resolveMinigameTypeFromSlug("drawing"), "DRAWING");
  assert.equal(resolveMinigameTypeFromSlug("unknown"), null);
});

test("client registry slug resolution stays aligned with shared definitions", () => {
  for (const minigameType of MINIGAME_TYPES) {
    const slug = MINIGAME_DEFINITIONS[minigameType].slug;
    assert.equal(resolveMinigameTypeFromSlug(slug), minigameType);
    assert.equal(resolveSharedMinigameTypeFromSlug(slug), minigameType);
  }
});
