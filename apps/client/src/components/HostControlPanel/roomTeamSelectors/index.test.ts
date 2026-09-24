import assert from "node:assert/strict";
import test from "node:test";
import { Phase } from "@wingnight/shared";

import { buildRoomState } from "../../../testSupport/roomStateFixtures";
import { resolveOrderedTeams } from "./index";

const teams = [
  { id: "team-1", name: "Molten Metal", playerIds: ["player-1"], totalScore: 0 },
  { id: "team-2", name: "Disco Inferno", playerIds: ["player-2"], totalScore: 0 },
  { id: "team-3", name: "Country Roads", playerIds: ["player-3"], totalScore: 0 }
];

const teamIdsOf = (orderedTeams: { id: string }[]): string[] => {
  return orderedTeams.map((team) => team.id);
};

test("does list the base order before round one when the host is still in INTRO", () => {
  const orderedTeams = resolveOrderedTeams(
    buildRoomState({
      phase: Phase.INTRO,
      currentRound: 0,
      teams,
      turnOrderTeamIds: ["team-3", "team-1", "team-2"]
    })
  );

  assert.deepEqual(teamIdsOf(orderedTeams), ["team-3", "team-1", "team-2"]);
});

test("does open the list one team further down the base order when a later round is on", () => {
  const orderedTeams = resolveOrderedTeams(
    buildRoomState({
      phase: Phase.EATING,
      currentRound: 2,
      teams,
      turnOrderTeamIds: ["team-1", "team-2", "team-3"]
    })
  );

  assert.deepEqual(teamIdsOf(orderedTeams), ["team-2", "team-3", "team-1"]);
});

test("does show the round about to start when the host edits the order at ROUND_RESULTS", () => {
  const orderedTeams = resolveOrderedTeams(
    buildRoomState({
      phase: Phase.ROUND_RESULTS,
      currentRound: 2,
      teams,
      turnOrderTeamIds: ["team-1", "team-2", "team-3"]
    })
  );

  assert.deepEqual(teamIdsOf(orderedTeams), ["team-3", "team-1", "team-2"]);
});

test("does fall back to the roster order when the turn order does not cover every team", () => {
  const orderedTeams = resolveOrderedTeams(
    buildRoomState({
      phase: Phase.EATING,
      currentRound: 2,
      teams,
      turnOrderTeamIds: ["team-1", "team-2"]
    })
  );

  assert.deepEqual(teamIdsOf(orderedTeams), ["team-1", "team-2", "team-3"]);
  assert.deepEqual(resolveOrderedTeams(null), []);
});
