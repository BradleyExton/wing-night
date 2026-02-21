import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveMinigameDevManifest,
  resolveMinigameRendererBundle,
  resolveMinigameTypeFromSlug
} from "./index";

test("resolves renderer bundles for all minigame types", () => {
  assert.ok(resolveMinigameRendererBundle("TRIVIA"));
  assert.ok(resolveMinigameRendererBundle("GEO"));
  assert.ok(resolveMinigameRendererBundle("DRAWING"));
});

test("resolves dev manifests for all minigame types", () => {
  assert.ok(resolveMinigameDevManifest("TRIVIA"));
  assert.ok(resolveMinigameDevManifest("GEO"));
  assert.ok(resolveMinigameDevManifest("DRAWING"));
});

test("maps route slugs to minigame types", () => {
  assert.equal(resolveMinigameTypeFromSlug("trivia"), "TRIVIA");
  assert.equal(resolveMinigameTypeFromSlug("geo"), "GEO");
  assert.equal(resolveMinigameTypeFromSlug("drawing"), "DRAWING");
  assert.equal(resolveMinigameTypeFromSlug("unknown"), null);
});
