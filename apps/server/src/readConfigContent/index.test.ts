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

test("carries an authored colour from disk into the config content snapshot", () => {
  const teams = readTeamsFrom(
    JSON.stringify({
      teams: [{ name: "Hot Ones", genre: "metal", color: "teamD" }]
    })
  );

  assert.deepEqual(teams, [{ name: "Hot Ones", genre: "metal", color: "teamD" }]);
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

test("does not drop prompts tagged with players who are off tonight's roster", () => {
  const contentRoot = createContentRoot();

  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(
    contentRoot,
    "sample/minigames/trivia.json",
    JSON.stringify({
      prompts: [
        { id: "t-1", question: "Everyone?", answer: "Yes" },
        {
          id: "t-2",
          question: "Who is away?",
          answer: "Robin",
          featuredPlayers: ["Robin"]
        }
      ]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/drawing.json",
    JSON.stringify({
      prompts: [{ id: "d-1", prompt: "Robin", featuredPlayers: ["Robin"] }]
    })
  );

  const result = readConfigContent({ contentRootDir: contentRoot });

  assert.ok(result.ok);
  // The wizard writes these banks back to disk, so a roster-filtered read
  // would delete every prompt about someone who is not here tonight.
  assert.deepEqual(
    result.content.triviaPrompts.map((prompt) => prompt.id),
    ["t-1", "t-2"]
  );
  assert.deepEqual(
    result.content.drawingPrompts.map((prompt) => prompt.id),
    ["d-1"]
  );
});
