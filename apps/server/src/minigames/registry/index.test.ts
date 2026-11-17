import assert from "node:assert/strict";
import test from "node:test";

import { CONTESTANT_MINIGAME_TYPES, CREW_MINIGAME_TYPES, MINIGAME_TYPES } from "@wingnight/shared";

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

    // `contestantActionTypes` is shared with the crew games, which name their phones' inputs
    // the same way; on its own, beside `selectCrew`, it is not a relay's hook.
    return (
      runtimePlugin.selectContestant !== undefined ||
      (runtimePlugin.contestantActionTypes !== undefined && runtimePlugin.selectCrew === undefined) ||
      runtimePlugin.contestantRetakeActionType !== undefined ||
      runtimePlugin.contestantResetActionType !== undefined
    );
  });

  assert.deepEqual([...withHooks].sort(), [...CONTESTANT_MINIGAME_TYPES].sort());

  for (const minigameType of CONTESTANT_MINIGAME_TYPES) {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

    assert.ok(runtimePlugin.selectContestant !== undefined, minigameType);
    assert.ok((runtimePlugin.contestantActionTypes ?? []).length > 0, minigameType);
    // A reset hands every leg back to its phone, so each relay names its reset hatch.
    assert.ok(runtimePlugin.contestantResetActionType !== undefined, minigameType);

    // A phone never sends a hatch: no skip, no reset, no retake among its actions.
    for (const actionType of runtimePlugin.contestantActionTypes ?? []) {
      assert.equal(/^(skip|reset|retake|next)/.test(actionType), false, `${minigameType} ${actionType}`);
    }
  }
});

// The crew hook makes every phone on a team a gamepad at once. A game growing it has to join
// `CREW_MINIGAME_TYPES`, name what its phones may send, and be a crew game only — one leg in hand
// and a whole team playing are two different turns, and no game is both.
test("does give the crew hook to exactly the crew games, and never beside a relay's", () => {
  const withCrew = MINIGAME_TYPES.filter((minigameType) => {
    return resolveMinigameRuntimePlugin(minigameType).selectCrew !== undefined;
  });

  assert.deepEqual([...withCrew].sort(), [...CREW_MINIGAME_TYPES].sort());

  for (const minigameType of CREW_MINIGAME_TYPES) {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

    assert.equal(runtimePlugin.selectContestant, undefined, minigameType);
    assert.equal(CONTESTANT_MINIGAME_TYPES.some((relay) => relay === minigameType), false, minigameType);
    assert.ok((runtimePlugin.contestantActionTypes ?? []).length > 0, minigameType);

    // A phone never sends a hatch: no skip and no reset among a crew's actions either.
    for (const actionType of runtimePlugin.contestantActionTypes ?? []) {
      assert.equal(/^(skip|reset|retake|next)/.test(actionType), false, `${minigameType} ${actionType}`);
    }
  }
});
