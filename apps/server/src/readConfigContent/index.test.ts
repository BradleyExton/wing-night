import assert from "node:assert/strict";
import test from "node:test";

import {
  createContentRoot,
  writeContentFile,
  writeValidContentTree
} from "../contentLoader/testHarness.js";
import { readConfigContent } from "./index.js";

const readTeamsFrom = (teamsJson: string): unknown => {
  const contentRoot = createContentRoot();

  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(contentRoot, "sample/teams.json", teamsJson);

  const result = readConfigContent({ contentRootDir: contentRoot });

  assert.equal(result.ok, true);
  assert.ok(result.ok);

  return result.content.teams;
};

test("carries genre and anthems from disk into the config content snapshot", () => {
  const teams = readTeamsFrom(
    JSON.stringify({
      teams: [{ name: "Hot Ones", genre: "metal", anthems: ["blaze.mp3"] }]
    })
  );

  assert.deepEqual(teams, [
    { name: "Hot Ones", genre: "metal", anthems: ["blaze.mp3"] }
  ]);
});

test("yields exactly a name for a team that declares neither field", () => {
  const teams = readTeamsFrom(
    JSON.stringify({ teams: [{ name: "Mild Bunch" }] })
  );

  // deepEqual on the whole entry, not a property probe: it also catches an
  // implementation that re-adds the keys as explicit `undefined`.
  assert.deepEqual(teams, [{ name: "Mild Bunch" }]);
});

test("preserves every anthem in order for a team with several", () => {
  const teams = readTeamsFrom(
    JSON.stringify({
      teams: [
        {
          name: "Hot Ones",
          genre: "metal",
          anthems: ["one.mp3", "two.mp3", "three.mp3"]
        }
      ]
    })
  );

  assert.deepEqual(teams, [
    {
      name: "Hot Ones",
      genre: "metal",
      anthems: ["one.mp3", "two.mp3", "three.mp3"]
    }
  ]);
});
