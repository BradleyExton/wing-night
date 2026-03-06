import assert from "node:assert/strict";
import test from "node:test";

import {
  createTeam,
  resetRoomState,
  setRoomStatePlayers
} from "../index.js";
import { applyRoomStateMutation } from "./index.js";

test("applyRoomStateMutation reports didMutate=true for stateful changes", () => {
  resetRoomState();
  setRoomStatePlayers([{ id: "player-1", name: "Player One" }]);

  const mutationResult = applyRoomStateMutation(() => createTeam("Team Alpha"));

  assert.equal(mutationResult.didMutate, true);
  assert.equal(mutationResult.roomState.teams.length, 1);
});

test("applyRoomStateMutation reports didMutate=false for no-op mutations", () => {
  resetRoomState();

  const mutationResult = applyRoomStateMutation(() => createTeam("   "));

  assert.equal(mutationResult.didMutate, false);
  assert.equal(mutationResult.roomState.teams.length, 0);
});
