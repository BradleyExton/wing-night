import assert from "node:assert/strict";
import test from "node:test";

import { CONTESTANT_MINIGAME_TYPES, MINIGAME_TYPES } from "@wingnight/shared";

import { resolveMinigameRuntimePlugin } from "./index.js";

test("resolveMinigameRuntimePlugin resolves runtime plugin for each minigame", () => {
  for (const minigameType of MINIGAME_TYPES) {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);
    assert.equal(runtimePlugin.id, minigameType);
  }
});

test("server runtime registry covers every shared minigame definition", () => {
  for (const minigameType of MINIGAME_TYPES) {
    assert.doesNotThrow(() => {
      resolveMinigameRuntimePlugin(minigameType);
    });
  }
});

// The phone hooks are what let a guest's phone be handed a game's host view. Exactly the four
// arcade relays carry them — a game growing them has to join `CONTESTANT_MINIGAME_TYPES` (and
// prove its host view carries no answer) before a phone ever sees it.
test("does give the phone hooks to exactly the four arcade relays", () => {
  const withHooks = MINIGAME_TYPES.filter((minigameType) => {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

    return (
      runtimePlugin.selectContestant !== undefined ||
      runtimePlugin.contestantActionTypes !== undefined ||
      runtimePlugin.contestantRetakeActionType !== undefined
    );
  });

  assert.deepEqual([...withHooks].sort(), [...CONTESTANT_MINIGAME_TYPES].sort());

  for (const minigameType of CONTESTANT_MINIGAME_TYPES) {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

    assert.ok(runtimePlugin.selectContestant !== undefined, minigameType);
    assert.ok((runtimePlugin.contestantActionTypes ?? []).length > 0, minigameType);

    // A phone never sends a hatch: no skip, no reset, no retake among its actions.
    for (const actionType of runtimePlugin.contestantActionTypes ?? []) {
      assert.equal(/^(skip|reset|retake|next)/.test(actionType), false, `${minigameType} ${actionType}`);
    }
  }
});
