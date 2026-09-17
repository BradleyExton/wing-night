import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveTeamIndexByName,
  toTeamMatchKey,
  validateRosterAssignments
} from "./index.js";

const TEAMS = {
  teams: [{ name: "Scorch Squad" }, { name: "Blaze Brigade" }]
};

test("returns no issues when no player declares a team", () => {
  const players = { players: [{ name: "Ada" }, { name: "Grace" }] };

  assert.deepEqual(validateRosterAssignments(players, TEAMS), []);
});

test("returns no issues when every declared team exists", () => {
  const players = {
    players: [
      { name: "Ada", team: "Scorch Squad" },
      { name: "Grace", team: "Blaze Brigade" }
    ]
  };

  assert.deepEqual(validateRosterAssignments(players, TEAMS), []);
});

test("matches a team name ignoring case and surrounding whitespace", () => {
  const players = {
    players: [
      { name: "Ada", team: "  scorch squad " },
      { name: "Grace", team: "BLAZE BRIGADE" }
    ]
  };

  assert.deepEqual(validateRosterAssignments(players, TEAMS), []);
});

test("reports the player index when a team name matches no team", () => {
  const players = {
    players: [
      { name: "Ada", team: "Scorch Squad" },
      { name: "Grace", team: "Pepper Riot" }
    ]
  };

  const issues = validateRosterAssignments(players, TEAMS);

  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.path, "players[1].team");
  assert.match(issues[0]?.message ?? "", /Pepper Riot/);
});

// A blank `team` is already reported by `validatePlayersContentFile` as "must be
// a non-empty string when present". Reporting it a second time here would put
// two messages on one field that describe the same typo.
test("does not report a blank team, which the players validator already owns", () => {
  const players = { players: [{ name: "Ada", team: "   " }] };

  assert.deepEqual(validateRosterAssignments(players, TEAMS), []);
});

test("resolves the index of a matching team and -1 when none matches", () => {
  assert.equal(resolveTeamIndexByName("blaze brigade", TEAMS), 1);
  assert.equal(resolveTeamIndexByName("Inferno Crew", TEAMS), -1);
});

// Internal spacing is significant on purpose: collapsing it would make two
// genuinely different team names match.
test("does not collapse internal whitespace when matching", () => {
  assert.equal(toTeamMatchKey("  The Heat  "), "the heat");
  assert.equal(resolveTeamIndexByName("ScorchSquad", TEAMS), -1);
});
