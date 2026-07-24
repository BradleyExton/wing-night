import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { Phase } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  getRoomStateSnapshot,
  redoLastScoringMutation,
  resetRoomState,
  setRoomStatePlayers,
  setWingParticipation
} from "./index.js";
import {
  advanceToEatingPhase,
  advanceToRoundResultsPhase,
  setupValidTeamsAndAssignments
} from "./testHarness.js";

beforeEach(() => {
  resetRoomState();
});

test("setWingParticipation only accepts active-team players and accumulates by turn", () => {
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], true);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 0);

  setWingParticipation("player-2", true);

  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 0);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setWingParticipation("player-2", true);

  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 2);
});

test("setWingParticipation recomputes totals when a player is unchecked", () => {
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  setWingParticipation("player-1", false);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], false);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 0);
});

test("setWingParticipation idempotent updates do not replace redo snapshot", () => {
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.canRedoScoringMutation, true);

  setWingParticipation("player-1", true);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], true);
  assert.equal(snapshot.canRedoScoringMutation, true);

  redoLastScoringMutation();
  snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
  assert.equal(snapshot.canRedoScoringMutation, false);
});

test("setWingParticipation ignores invalid mutations", () => {
  setupValidTeamsAndAssignments();

  setWingParticipation("player-1", true);
  let snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});

  advanceToEatingPhase();
  setWingParticipation("missing-player", true);
  snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
});

test("setWingParticipation ignores updates for players not assigned to a team", () => {
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" }
  ]);
  const beforeMutation = getRoomStateSnapshot();

  setWingParticipation("player-3", true);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.wingParticipationByPlayerId["player-3"], undefined);
  assert.deepEqual(
    snapshot.pendingWingPointsByTeamId,
    beforeMutation.pendingWingPointsByTeamId
  );
});

test("entering EATING clears wing participation from the previous round", () => {
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceToRoundResultsPhase(1);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.EATING);
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
});
