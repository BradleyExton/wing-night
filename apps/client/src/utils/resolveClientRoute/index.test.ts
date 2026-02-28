import assert from "node:assert/strict";
import test from "node:test";

import { resolveClientRoute, resolveDevMinigameSlug } from "./index";

test("resolves /host and /host/ to HOST", () => {
  assert.equal(resolveClientRoute("/host"), "HOST");
  assert.equal(resolveClientRoute("/host/"), "HOST");
});

test("resolves / and trailing root slash to ROOT", () => {
  assert.equal(resolveClientRoute("/"), "ROOT");
});

test("resolves /display and /display/ to DISPLAY", () => {
  assert.equal(resolveClientRoute("/display"), "DISPLAY");
  assert.equal(resolveClientRoute("/display/"), "DISPLAY");
});

test("resolves /dev/minigame/:slug routes to DEV_MINIGAME", () => {
  assert.equal(resolveClientRoute("/dev/minigame/trivia"), "DEV_MINIGAME");
  assert.equal(resolveClientRoute("/dev/minigame/trivia/"), "DEV_MINIGAME");
  assert.equal(resolveDevMinigameSlug("/dev/minigame/trivia"), "trivia");
  assert.equal(resolveDevMinigameSlug("/dev/minigame/GEO/"), "geo");
});

test("resolves unknown routes to NOT_FOUND", () => {
  assert.equal(resolveClientRoute("/anything-else"), "NOT_FOUND");
  assert.equal(resolveClientRoute("/dev/minigame"), "NOT_FOUND");
});
