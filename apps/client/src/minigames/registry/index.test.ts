import assert from "node:assert/strict";
import test from "node:test";
import {
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPES,
  resolveMinigameTypeFromSlug
} from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRendererBundle,
  resolveMinigameRuntimePlugin
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

test("resolves runtime plugins matching each minigame type", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.equal(resolveMinigameRuntimePlugin(minigameType)?.id, minigameType);
  }
});

test("shared slug resolution reaches every registered minigame", () => {
  for (const minigameType of MINIGAME_TYPES) {
    const slug = MINIGAME_DEFINITIONS[minigameType].slug;
    assert.equal(resolveMinigameTypeFromSlug(slug), minigameType);
    assert.ok(resolveMinigameRendererBundle(minigameType));
  }

  assert.equal(resolveMinigameTypeFromSlug("unknown"), null);
});
