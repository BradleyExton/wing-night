import assert from "node:assert/strict";
import test from "node:test";

import { resolveOnlineGameFromPath, resolveRoomCodeFromPath } from "./index";

test("does read each game off its own room pages", () => {
  assert.equal(resolveOnlineGameFromPath("/play"), "BRAWL");
  assert.equal(resolveOnlineGameFromPath("/play/ABCD"), "BRAWL");
  assert.equal(resolveOnlineGameFromPath("/base-borden"), "BORDEN");
  assert.equal(resolveOnlineGameFromPath("/base-borden/WXYZ"), "BORDEN");
});

test("does read no game when the page is not a room page", () => {
  assert.equal(resolveOnlineGameFromPath("/"), null);
  assert.equal(resolveOnlineGameFromPath("/streets-of-barrie"), null);
  assert.equal(resolveOnlineGameFromPath("/base-bordenx"), null);
});

test("does read the room code off the game's own page, and nothing off its home or a bad code", () => {
  assert.equal(resolveRoomCodeFromPath("/base-borden/wxyz", "BORDEN"), "WXYZ");
  assert.equal(resolveRoomCodeFromPath("/play/ABCD", "BRAWL"), "ABCD");
  assert.equal(resolveRoomCodeFromPath("/base-borden", "BORDEN"), null);
  assert.equal(resolveRoomCodeFromPath("/base-borden/AB1", "BORDEN"), null);
  assert.equal(resolveRoomCodeFromPath("/play/ABCD", "BORDEN"), null);
});
