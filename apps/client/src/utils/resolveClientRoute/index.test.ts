import assert from "node:assert/strict";
import test from "node:test";

import { resolveClientRoute, resolveDevLabName, resolveDevMinigameSlug } from "./index";

test("resolves /host and /host/ to HOST", () => {
  assert.equal(resolveClientRoute("/host"), "HOST");
  assert.equal(resolveClientRoute("/host/"), "HOST");
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

test("resolves /dev/lab/:name routes to DEV_LAB", () => {
  assert.equal(resolveClientRoute("/dev/lab/anamorph"), "DEV_LAB");
  assert.equal(resolveClientRoute("/dev/lab/anamorph/"), "DEV_LAB");
  assert.equal(resolveDevLabName("/dev/lab/anamorph"), "anamorph");
  assert.equal(resolveDevLabName("/dev/lab/ANAMORPH/"), "anamorph");
});

// WN-18's lab rides the generic route WN-16 added rather than adding a second one. Nothing in
// apps/client/src imports App, so its dispatch branch is unreachable from a test — pinning the
// name here is the half of that wiring a test CAN hold.
test("resolves the contraption lab name to DEV_LAB", () => {
  assert.equal(resolveClientRoute("/dev/lab/contraption"), "DEV_LAB");
  assert.equal(resolveDevLabName("/dev/lab/contraption"), "contraption");
});

test("resolves the bare /dev/lab prefix to NOT_FOUND when no name follows", () => {
  assert.equal(resolveClientRoute("/dev/lab"), "NOT_FOUND");
  assert.equal(resolveClientRoute("/dev/lab/"), "NOT_FOUND");
  assert.equal(resolveDevLabName("/dev/lab/"), null);
  assert.equal(resolveDevLabName("/dev/lab/anamorph/extra"), null);
});

test("keeps the two dev route prefixes from matching each other", () => {
  assert.equal(resolveDevLabName("/dev/minigame/trivia"), null);
  assert.equal(resolveDevMinigameSlug("/dev/lab/anamorph"), null);
});

test("resolves unknown routes to NOT_FOUND", () => {
  assert.equal(resolveClientRoute("/anything-else"), "NOT_FOUND");
  assert.equal(resolveClientRoute("/dev/minigame"), "NOT_FOUND");
});

test("resolves / to ROOT", () => {
  assert.equal(resolveClientRoute("/"), "ROOT");
});
