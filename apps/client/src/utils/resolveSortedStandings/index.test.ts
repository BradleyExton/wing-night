import assert from "node:assert/strict";
import test from "node:test";

import type { Team } from "@wingnight/shared";

import { resolveSortedStandings } from "./index";

const createTeam = (id: string, name: string, totalScore: number): Team => {
  return {
    id,
    name,
    playerIds: [],
    totalScore
  };
};

test("sorts teams by score descending and then by name", () => {
  const sortedTeams = resolveSortedStandings([
    createTeam("team-3", "Gamma", 8),
    createTeam("team-2", "Alpha", 12),
    createTeam("team-1", "Beta", 12)
  ]);

  assert.deepEqual(
    sortedTeams.map((team) => team.id),
    ["team-2", "team-1", "team-3"]
  );
});
