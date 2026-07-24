import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type RoomState } from "@wingnight/shared";

import { buildRoomState } from "../../../testSupport/roomStateFixtures";
import {
  hasCustomTurnOrder,
  selectOverrideDockContext
} from "./index";

const buildSnapshot = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  return buildRoomState({
    phase,
    players: [
      { id: "player-1", name: "Alex" },
      { id: "player-2", name: "Jordan" }
    ],
    ...overrides
  });
};

test("dock is visible only in gameplay phases", () => {
  assert.equal(selectOverrideDockContext(null).isVisible, false);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.SETUP)).isVisible, false);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.INTRO)).isVisible, false);

  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.ROUND_INTRO)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.EATING)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_INTRO)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_PLAY)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.ROUND_RESULTS)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.FINAL_RESULTS)).isVisible, true);
});

test("skip-turn action is limited to turn phases", () => {
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.ROUND_INTRO)).showSkipTurnBoundaryAction,
    false
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.EATING)).showSkipTurnBoundaryAction,
    true
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_INTRO)).showSkipTurnBoundaryAction,
    true
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_PLAY)).showSkipTurnBoundaryAction,
    true
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.ROUND_RESULTS)).showSkipTurnBoundaryAction,
    false
  );
});

test("turn-order editability is round-intro only", () => {
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.ROUND_INTRO)).isTurnOrderEditable,
    true
  );
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.EATING)).isTurnOrderEditable, false);
});

test("badge turns on for redo availability", () => {
  const context = selectOverrideDockContext(
    buildSnapshot(Phase.ROUND_RESULTS, { canRedoScoringMutation: true })
  );

  assert.equal(context.showRedoLastMutationAction, true);
  assert.equal(context.showBadge, true);
});

test("badge turns on for custom turn order", () => {
  const roomState = buildSnapshot(Phase.ROUND_RESULTS, {
    turnOrderTeamIds: ["team-beta", "team-alpha"]
  });

  assert.equal(hasCustomTurnOrder(roomState), true);
  assert.equal(selectOverrideDockContext(roomState).showBadge, true);
});

test("badge stays off when redo is unavailable and turn order is default", () => {
  const roomState = buildSnapshot(Phase.ROUND_RESULTS);

  assert.equal(hasCustomTurnOrder(roomState), false);
  assert.equal(selectOverrideDockContext(roomState).showBadge, false);
});
