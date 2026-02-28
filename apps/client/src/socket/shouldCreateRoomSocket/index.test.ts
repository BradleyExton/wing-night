import assert from "node:assert/strict";
import test from "node:test";

import { shouldCreateRoomSocket } from "./index";

test("creates socket only for host and display routes", () => {
  assert.equal(shouldCreateRoomSocket("ROOT"), false);
  assert.equal(shouldCreateRoomSocket("HOST"), true);
  assert.equal(shouldCreateRoomSocket("DISPLAY"), true);
  assert.equal(shouldCreateRoomSocket("DEV_MINIGAME"), false);
  assert.equal(shouldCreateRoomSocket("NOT_FOUND"), false);
});
