import assert from "node:assert/strict";
import test from "node:test";

import {
  isPlayersContentFile,
  validatePlayersContentEntry,
  validatePlayersContentFile
} from "./index.js";

const pathsOf = (issues: { path: string }[]): string[] => {
  return issues.map((issue) => issue.path);
};

test("returns no issues when every entry has a name", () => {
  const content = { players: [{ name: "Ada" }, { name: "Grace" }] };

  assert.deepEqual(validatePlayersContentFile(content), []);
});

test("returns no issues when the players array is empty", () => {
  assert.deepEqual(validatePlayersContentFile({ players: [] }), []);
});

test("reports the entry index when a player name is blank", () => {
  const content = { players: [{ name: "Ada" }, { name: "  " }] };

  assert.deepEqual(pathsOf(validatePlayersContentFile(content)), [
    "players[1].name"
  ]);
});

test("accumulates issues across multiple invalid entries", () => {
  const content = { players: [{ name: "" }, { name: "Grace" }, {}] };

  assert.deepEqual(pathsOf(validatePlayersContentFile(content)), [
    "players[0].name",
    "players[2].name"
  ]);
});

test("reports the entry itself when a player is not an object", () => {
  const content = { players: ["Ada"] };

  assert.deepEqual(pathsOf(validatePlayersContentFile(content)), ["players[0]"]);
});

test("reports the players path when players is not an array", () => {
  assert.deepEqual(pathsOf(validatePlayersContentFile({ players: {} })), [
    "players"
  ]);
});

test("accepts an entry with no avatarSrc key at all", () => {
  assert.deepEqual(validatePlayersContentEntry({ name: "Ada" }), []);
});

test("reports avatarSrc when the key is present but blank", () => {
  const issues = validatePlayersContentEntry({ name: "Ada", avatarSrc: "" });

  assert.deepEqual(pathsOf(issues), ["avatarSrc"]);
});

test("reports avatarSrc when the key is present but undefined", () => {
  const issues = validatePlayersContentEntry({
    name: "Ada",
    avatarSrc: undefined
  });

  assert.deepEqual(pathsOf(issues), ["avatarSrc"]);
});

test("rejects via the predicate every value the validator reports issues for", () => {
  const rejected: unknown[] = [
    null,
    "nope",
    {},
    { players: {} },
    { players: [{ name: "" }] },
    { players: [{ name: "Ada", avatarSrc: undefined }] }
  ];

  for (const value of rejected) {
    assert.equal(isPlayersContentFile(value), false);
    assert.ok(validatePlayersContentFile(value).length > 0);
  }
});

test("accepts an entry with no team key at all", () => {
  assert.deepEqual(validatePlayersContentEntry({ name: "Ada" }), []);
});

test("accepts an entry whose team is a non-empty string", () => {
  assert.deepEqual(
    validatePlayersContentEntry({ name: "Ada", team: "Scorch Squad" }),
    []
  );
});

// Whether the name matches a real team is `validateRosterAssignments`'s job —
// this validator only sees players.json and cannot know the teams.
test("reports team when the key is present but blank", () => {
  const issues = validatePlayersContentEntry({ name: "Ada", team: "   " });

  assert.deepEqual(pathsOf(issues), ["team"]);
});

test("reports the entry index when a player's team is blank", () => {
  const content = {
    players: [{ name: "Ada", team: "Scorch Squad" }, { name: "Grace", team: "" }]
  };

  assert.deepEqual(pathsOf(validatePlayersContentFile(content)), [
    "players[1].team"
  ]);
});

test("rejects a team that is present and not a string", () => {
  assert.deepEqual(
    pathsOf(validatePlayersContentEntry({ name: "Ada", team: 2 })),
    ["team"]
  );
});
