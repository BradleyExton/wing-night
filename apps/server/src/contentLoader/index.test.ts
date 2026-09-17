import assert from "node:assert/strict";
import test from "node:test";

import { loadContent } from "./index.js";
import {
  createContentRoot,
  createValidDrawingJson as createValidDrawing,
  createValidGameConfigJson,
  createValidGeoJson as createValidGeo,
  createValidSongGuessJson as createValidSongGuess,
  createValidTriviaJson as createValidTrivia,
  writeContentFile
} from "./testHarness.js";

test("loads all content from local files when available", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/players.json",
    JSON.stringify({
      players: [{ name: "Local Player" }]
    })
  );
  writeContentFile(
    contentRoot,
    "local/teams.json",
    JSON.stringify({
      teams: [{ name: "Local Team" }]
    })
  );
  writeContentFile(contentRoot, "local/gameConfig.json", createValidGameConfigJson("Local"));
  writeContentFile(
    contentRoot,
    "local/minigames/trivia.json",
    createValidTrivia("Local")
  );
  writeContentFile(contentRoot, "local/minigames/geo.json", createValidGeo("Local"));
  writeContentFile(
    contentRoot,
    "local/minigames/drawing.json",
    createValidDrawing("Local")
  );
  writeContentFile(
    contentRoot,
    "local/minigames/song-guess.json",
    createValidSongGuess("Local")
  );

  writeContentFile(
    contentRoot,
    "sample/players.json",
    JSON.stringify({
      players: [{ name: "Sample Player" }]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/teams.json",
    JSON.stringify({
      teams: [{ name: "Sample Team" }]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidGameConfigJson("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/trivia.json",
    createValidTrivia("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/geo.json",
    createValidGeo("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/drawing.json",
    createValidDrawing("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/song-guess.json",
    createValidSongGuess("Sample")
  );

  const content = loadContent({ contentRootDir: contentRoot });

  assert.equal(content.players[0]?.name, "Local Player");
  assert.equal(content.teams[0]?.name, "Local Team");
  assert.equal(content.gameConfig.name, "Local");
  const triviaContent = content.minigameContentById.TRIVIA as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(triviaContent?.prompts?.[0]?.id, "local-1");
  const geoContent = content.minigameContentById.GEO as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(geoContent?.prompts?.[0]?.id, "local-geo-1");
  const drawingContent = content.minigameContentById.DRAWING as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(drawingContent?.prompts?.[0]?.id, "local-drawing-1");
  const songGuessContent = content.minigameContentById.SONG_GUESS as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(songGuessContent?.prompts?.[0]?.id, "local-song-1");
});

test("falls back to sample files when local files are missing", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/players.json",
    JSON.stringify({
      players: [{ name: "Sample Player" }]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/teams.json",
    JSON.stringify({
      teams: [{ name: "Sample Team" }]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidGameConfigJson("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/trivia.json",
    createValidTrivia("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/geo.json",
    createValidGeo("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/drawing.json",
    createValidDrawing("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/song-guess.json",
    createValidSongGuess("Sample")
  );

  const content = loadContent({ contentRootDir: contentRoot });

  assert.equal(content.players[0]?.name, "Sample Player");
  assert.deepEqual(content.teams, [
    { id: "team-1", name: "Sample Team", playerIds: [], totalScore: 0 }
  ]);
  assert.equal(content.gameConfig.name, "Sample");
  const triviaContent = content.minigameContentById.TRIVIA as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(triviaContent?.prompts?.[0]?.id, "sample-1");
  const geoContent = content.minigameContentById.GEO as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(geoContent?.prompts?.[0]?.id, "sample-geo-1");
  const drawingContent = content.minigameContentById.DRAWING as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(drawingContent?.prompts?.[0]?.id, "sample-drawing-1");
  const songGuessContent = content.minigameContentById.SONG_GUESS as
    | { prompts?: Array<{ id?: string }> }
    | undefined;
  assert.equal(songGuessContent?.prompts?.[0]?.id, "sample-song-1");
});

// Every other file is only here so `loadContent` can complete; the assertion is
// about the two roster files being joined.
const writeRosterContentRoot = (playersJson: string, teamsJson: string): string => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/players.json", playersJson);
  writeContentFile(contentRoot, "sample/teams.json", teamsJson);
  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidGameConfigJson("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/trivia.json",
    createValidTrivia("Sample")
  );
  writeContentFile(contentRoot, "sample/minigames/geo.json", createValidGeo("Sample"));
  writeContentFile(
    contentRoot,
    "sample/minigames/drawing.json",
    createValidDrawing("Sample")
  );
  writeContentFile(
    contentRoot,
    "sample/minigames/song-guess.json",
    createValidSongGuess("Sample")
  );

  return contentRoot;
};

test("seats players on the team their entry names", () => {
  const contentRoot = writeRosterContentRoot(
    JSON.stringify({
      players: [
        { name: "Ada", team: "Blaze Brigade" },
        { name: "Grace", team: "Scorch Squad" },
        { name: "Alan", team: "Blaze Brigade" },
        { name: "Katherine" }
      ]
    }),
    JSON.stringify({ teams: [{ name: "Scorch Squad" }, { name: "Blaze Brigade" }] })
  );

  const content = loadContent({ contentRootDir: contentRoot });

  assert.deepEqual(content.teams[0]?.playerIds, ["player-2"]);
  assert.deepEqual(content.teams[1]?.playerIds, ["player-1", "player-3"]);
  assert.equal(content.players[3]?.name, "Katherine");
});

test("fails to load when a player's team names no team", () => {
  const contentRoot = writeRosterContentRoot(
    JSON.stringify({ players: [{ name: "Ada", team: "Pepper Riot" }] }),
    JSON.stringify({ teams: [{ name: "Scorch Squad" }] })
  );

  assert.throws(
    () => loadContent({ contentRootDir: contentRoot }),
    /Pepper Riot/
  );
});

// Local wins per FILE, not per field: a local players.json naming a team that
// only the SAMPLE teams.json declares is a valid combination, and the join has
// to run across whichever pair actually loaded.
test("joins a local players file against a sample teams file", () => {
  const contentRoot = writeRosterContentRoot(
    JSON.stringify({ players: [{ name: "Sample Player" }] }),
    JSON.stringify({ teams: [{ name: "Sample Team" }] })
  );

  writeContentFile(
    contentRoot,
    "local/players.json",
    JSON.stringify({ players: [{ name: "Local Player", team: "Sample Team" }] })
  );

  const content = loadContent({ contentRootDir: contentRoot });

  assert.equal(content.players[0]?.name, "Local Player");
  assert.deepEqual(content.teams[0]?.playerIds, ["player-1"]);
});
