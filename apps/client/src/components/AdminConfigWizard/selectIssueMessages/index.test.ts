import assert from "node:assert/strict";
import test from "node:test";

import { selectFieldIssueText, selectIssueMessages } from "./index";

test("strips the file-key prefix the server adds when mapping an issue to a field", () => {
  const messagesByPath = selectIssueMessages(
    [{ path: "gameConfig.rounds[1].sauce", message: "must be a non-empty string" }],
    "gameConfig"
  );

  assert.deepEqual(messagesByPath.get("rounds[1].sauce"), [
    "must be a non-empty string"
  ]);
});

// "players.name" and "gameConfig.name" would otherwise both land on `name` and
// point the host at a field that is not the one that failed.
test("drops issues belonging to another content file", () => {
  const messagesByPath = selectIssueMessages(
    [
      { path: "players.name", message: "must be a non-empty string" },
      { path: "gameConfig.name", message: "must be a non-empty string" }
    ],
    "gameConfig"
  );

  assert.equal(messagesByPath.size, 1);
  assert.equal(messagesByPath.has("name"), true);
});

// The server reports a whole-file shape failure as the bare key, which is the
// root of the validated value — the empty path.
test("maps a whole-file issue to the root path when the path is the bare key", () => {
  const messagesByPath = selectIssueMessages(
    [{ path: "gameConfig", message: "must be an object" }],
    "gameConfig"
  );

  assert.deepEqual(messagesByPath.get(""), ["must be an object"]);
});

// One field can break more than one rule; keeping only the last would send the
// host round the loop twice for the same input.
test("keeps every message when one field fails more than one rule", () => {
  const messagesByPath = selectIssueMessages(
    [
      { path: "gameConfig.rounds[0].round", message: "must be a positive integer" },
      { path: "gameConfig.rounds[0].round", message: "must be 1" }
    ],
    "gameConfig"
  );

  assert.deepEqual(messagesByPath.get("rounds[0].round"), [
    "must be a positive integer",
    "must be 1"
  ]);
});

test("returns an empty map when there are no issues", () => {
  assert.equal(selectIssueMessages([], "gameConfig").size, 0);
});

test("joins every message for a field into one sentence", () => {
  const messagesByPath = selectIssueMessages(
    [
      { path: "gameConfig.name", message: "must be a non-empty string" },
      { path: "gameConfig.name", message: "must be shorter" }
    ],
    "gameConfig"
  );

  assert.equal(
    selectFieldIssueText(messagesByPath, "name"),
    "must be a non-empty string; must be shorter"
  );
});

test("returns null for a field with no issue so the row renders clean", () => {
  assert.equal(selectFieldIssueText(new Map(), "name"), null);
});
