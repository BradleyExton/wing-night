import assert from "node:assert/strict";
import test from "node:test";

import type { SerializableValue } from "@wingnight/minigames-core";
import { MOUNT_GOOSE_BOT_SAMPLES } from "@wingnight/shared";

import { mountRuntimePlugin } from "../runtime/index.js";
import { MOUNT_GOOSE_BOT_DEV_ACTION_ID, mountDevActions, mountDevManifest } from "./index.js";

const boot = () => {
  const state = mountRuntimePlugin.initialize({
    teamIds: [...mountDevManifest.teamIds],
    players: mountDevManifest.players,
    teams: mountDevManifest.teams,
    activeRoundTeamId: mountDevManifest.activeRoundTeamId,
    pointsMax: mountDevManifest.pointsMax,
    pendingPointsByTeamId: { ...mountDevManifest.pendingPointsByTeamId },
    rules: mountDevManifest.rules,
    content: null
  });

  if (state === null) {
    throw new Error("the sandbox boots a state");
  }

  return state;
};

const reduce = (state: SerializableValue, actionType: string, actionPayload: SerializableValue): SerializableValue => {
  return mountRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: mountDevManifest.pointsMax,
    rules: mountDevManifest.rules,
    content: null
  }).state;
};

const goose = mountDevActions.find((action) => action.id === MOUNT_GOOSE_BOT_DEV_ACTION_ID);

test("does feed the goose bot's log into the climb in hand as one stamped limb batch", () => {
  const state = boot();
  const action = goose?.resolve(mountRuntimePlugin.selectHostView({ state, rules: mountDevManifest.rules, content: null }));

  assert.ok(action);
  assert.equal(action.actionType, "limb");

  const fed = reduce(state, action.actionType, action.actionPayload);
  const view = mountRuntimePlugin.selectHostView({ state: fed, rules: mountDevManifest.rules, content: null });

  assert.equal(view?.minigame, "MOUNT");
  assert.equal(view?.minigame === "MOUNT" ? view.climbs[0]?.inputs.length : 0, MOUNT_GOOSE_BOT_SAMPLES.length);
});

test("does mount the goose and hand the line to the climber when the fed climb is ended", () => {
  const state = boot();
  const action = goose?.resolve(mountRuntimePlugin.selectHostView({ state, rules: mountDevManifest.rules, content: null }));

  assert.ok(action);

  const ended = reduce(reduce(state, action.actionType, action.actionPayload), "endClimb", { teamId: "team-alpha", climbIndex: 0 });
  const view = mountRuntimePlugin.selectHostView({ state: ended, rules: mountDevManifest.rules, content: null });

  assert.ok(view?.minigame === "MOUNT");
  assert.equal(view.pile.hens.length, 1);
  assert.equal(view.pile.highLine.playerId, "player-1");
  assert.equal(view.climbs[0]?.result?.outcome, "mounted");
});

test("does offer nothing once the climb in hand has been touched", () => {
  const state = boot();
  const action = goose?.resolve(mountRuntimePlugin.selectHostView({ state, rules: mountDevManifest.rules, content: null }));

  assert.ok(action);

  const fed = reduce(state, action.actionType, action.actionPayload);

  assert.equal(goose?.resolve(mountRuntimePlugin.selectHostView({ state: fed, rules: mountDevManifest.rules, content: null })), null);
});
