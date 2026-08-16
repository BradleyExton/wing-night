import assert from "node:assert/strict";
import test from "node:test";

import { resolveClientRoute, resolveDevLabName, resolveDevMinigameSlug } from "./index";

test("resolves /host and /host/ to HOST", () => {
  assert.equal(resolveClientRoute("/host"), "HOST");
  assert.equal(resolveClientRoute("/host/"), "HOST");
});

test("resolves /admin and /admin/ to ADMIN", () => {
  assert.equal(resolveClientRoute("/admin"), "ADMIN");
  assert.equal(resolveClientRoute("/admin/"), "ADMIN");
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

// WN-25's prototype rides the same generic route. Same reasoning as above: the App dispatch arm is
// unreachable from a test, so pinning the name is the half of that wiring a test CAN hold — and the
// hyphenated name additionally proves the segment matcher does not choke on the hyphen.
test("resolves the contraption-ui prototype name to DEV_LAB", () => {
  assert.equal(resolveClientRoute("/dev/lab/contraption-ui"), "DEV_LAB");
  assert.equal(resolveDevLabName("/dev/lab/contraption-ui"), "contraption-ui");
  assert.equal(resolveDevLabName("/dev/lab/CONTRAPTION-UI/"), "contraption-ui");
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

// A FIXED path, unlike the other two /dev/* routes — so it exercises the
// equality branch rather than the prefixed-segment helper.
test("resolves /dev/board and /dev/board/ to BOARD", () => {
  assert.equal(resolveClientRoute("/dev/board"), "BOARD");
  assert.equal(resolveClientRoute("/dev/board/"), "BOARD");
});

test("does not resolve a deeper path under /dev/board to BOARD", () => {
  assert.equal(resolveClientRoute("/dev/board/WN-26"), "NOT_FOUND");
});

// The board is not a lab, so the lab helper must not claim it — otherwise
// App would try to render a lab named "board".
test("does not read /dev/board as a dev lab", () => {
  assert.equal(resolveDevLabName("/dev/board"), null);
});
