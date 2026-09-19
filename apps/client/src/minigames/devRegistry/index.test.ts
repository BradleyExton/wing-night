import assert from "node:assert/strict";
import test from "node:test";
import { MINIGAME_TYPES } from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRuntimePlugin
} from "./index";

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
