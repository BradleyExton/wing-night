import assert from "node:assert/strict";
import test from "node:test";

import { shouldCreateRoomSocket } from "./index";

test("creates socket for the room-connected routes", () => {
  assert.equal(shouldCreateRoomSocket("HOST"), true);
  assert.equal(shouldCreateRoomSocket("DISPLAY"), true);
  assert.equal(shouldCreateRoomSocket("DEV_MINIGAME"), false);
  assert.equal(shouldCreateRoomSocket("NOT_FOUND"), false);
});

// The config wizard's only job is a `config:*` round trip; without a socket it
// would render and then be unable to read or apply anything.
test("creates socket for the admin route", () => {
  assert.equal(shouldCreateRoomSocket("ADMIN"), true);
});
