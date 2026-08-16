import assert from "node:assert/strict";
import test from "node:test";

import { isTeamsContentFile, validateTeamsContentFile } from "./index.js";

const pathsOf = (issues: { path: string }[]): string[] => {
  return issues.map((issue) => issue.path);
};

test("returns no issues when every team has a name", () => {
  const content = { teams: [{ name: "Hot Ones" }, { name: "Mild Bunch" }] };

  assert.deepEqual(validateTeamsContentFile(content), []);
});

test("returns no issues when the teams array is empty", () => {
  assert.deepEqual(validateTeamsContentFile({ teams: [] }), []);
});

test("reports the entry index when a team name is blank", () => {
  const content = { teams: [{ name: "Hot Ones" }, { name: "   " }] };

  assert.deepEqual(pathsOf(validateTeamsContentFile(content)), ["teams[1].name"]);
});

test("accumulates issues across multiple invalid entries", () => {
  const content = { teams: [{}, { name: "Mild Bunch" }, { name: 7 }] };

  assert.deepEqual(pathsOf(validateTeamsContentFile(content)), [
    "teams[0].name",
    "teams[2].name"
  ]);
});

test("reports the entry itself when a team is not an object", () => {
  assert.deepEqual(pathsOf(validateTeamsContentFile({ teams: [null] })), [
    "teams[0]"
  ]);
});

test("reports the teams path when teams is not an array", () => {
  assert.deepEqual(pathsOf(validateTeamsContentFile({ teams: "Hot Ones" })), [
    "teams"
  ]);
});

test("returns no issues when a team carries a valid genre and anthems", () => {
  const content = {
    teams: [{ name: "Hot Ones", genre: "metal", anthems: ["blaze.mp3"] }]
  };

  assert.deepEqual(validateTeamsContentFile(content), []);
});

test("returns no issues when a team omits genre and anthems entirely", () => {
  assert.deepEqual(validateTeamsContentFile({ teams: [{ name: "Hot Ones" }] }), []);
});

test("reports the genre path when genre is present but not a string", () => {
  const content = { teams: [{ name: "Hot Ones", genre: 42 }] };

  assert.deepEqual(pathsOf(validateTeamsContentFile(content)), [
    "teams[0].genre"
  ]);
});

test("reports the anthems path when anthems is a bare string rather than an array", () => {
  const content = { teams: [{ name: "Hot Ones", anthems: "blaze.mp3" }] };

  assert.deepEqual(pathsOf(validateTeamsContentFile(content)), [
    "teams[0].anthems"
  ]);
});

test("reports the anthems path when anthems contains blank entries", () => {
  const content = { teams: [{ name: "Hot Ones", anthems: ["", " "] }] };

  assert.deepEqual(pathsOf(validateTeamsContentFile(content)), [
    "teams[0].anthems"
  ]);
});

test("accumulates every invalid optional field on one entry", () => {
  const content = { teams: [{ name: "   ", genre: 42, anthems: ["ok.mp3", ""] }] };

  assert.deepEqual(pathsOf(validateTeamsContentFile(content)), [
    "teams[0].name",
    "teams[0].genre",
    "teams[0].anthems"
  ]);
});

test("rejects via the predicate every value the validator reports issues for", () => {
  const rejected: unknown[] = [
    null,
    "nope",
    {},
    { teams: "Hot Ones" },
    { teams: [{ name: "" }] },
    { teams: [null] }
  ];

  for (const value of rejected) {
    assert.equal(isTeamsContentFile(value), false);
    assert.ok(validateTeamsContentFile(value).length > 0);
  }
});
