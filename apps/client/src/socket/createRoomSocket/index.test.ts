import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES } from "@wingnight/shared";

import { resolveSocketClientRole } from "./index";

test("resolveSocketClientRole maps host route to HOST role", () => {
  assert.equal(resolveSocketClientRole("/host"), CLIENT_ROLES.HOST);
});

test("resolveSocketClientRole maps display and dev routes to DISPLAY role", () => {
  assert.equal(resolveSocketClientRole("/display"), CLIENT_ROLES.DISPLAY);
  assert.equal(resolveSocketClientRole("/dev/minigame/trivia"), CLIENT_ROLES.DISPLAY);
});
