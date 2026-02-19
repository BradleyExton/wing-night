import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import type { MinigameType } from "@wingnight/shared";

import { loadContent } from "./index.js";

const createdDirs: string[] = [];

const createContentRoot = (): string => {
  const contentRoot = mkdtempSync(join(tmpdir(), "wingnight-content-"));
  createdDirs.push(contentRoot);
  return contentRoot;
};

const writeContentFile = (
  contentRoot: string,
  relativePath: string,
  content: string
): void => {
  const fullPath = join(contentRoot, relativePath);
  const directoryPath = dirname(fullPath);

  mkdirSync(directoryPath, { recursive: true });
  writeFileSync(fullPath, content, "utf8");
};

const createValidConfig = (
  name: string,
  minigame: MinigameType = "TRIVIA"
): string => {
  return JSON.stringify({
    name,
    rounds: [
      {
        round: 1,
        label: "Warm Up",
        sauce: "Frank's",
        pointsPerPlayer: 2,
        minigame
      }
    ],
    minigameScoring: {
      defaultMax: 15,
      finalRoundMax: 20
    },
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
    }
  });
};

const createValidTrivia = (prefix: string): string => {
  return JSON.stringify({
    prompts: [
      {
        id: `${prefix.toLowerCase()}-1`,
        question: `${prefix} question 1?`,
        answer: `${prefix} answer 1`
      }
    ]
  });
};

test.after(() => {
  for (const dirPath of createdDirs) {
    rmSync(dirPath, { recursive: true, force: true });
  }
});

test("loads all content from local files when available", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/players.json",
    JSON.stringify({
      players: [{ name: "Local Player" }]
    })
  );
  writeContentFile(contentRoot, "local/gameConfig.json", createValidConfig("Local"));
  writeContentFile(contentRoot, "local/trivia.json", createValidTrivia("Local"));

  writeContentFile(
    contentRoot,
    "sample/players.json",
    JSON.stringify({
      players: [{ name: "Sample Player" }]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidConfig("Sample")
  );
  writeContentFile(contentRoot, "sample/trivia.json", createValidTrivia("Sample"));

  const content = loadContent({ contentRootDir: contentRoot });
  const triviaContent = content.minigameContentById.TRIVIA;

  assert.equal(content.players[0]?.name, "Local Player");
  assert.equal(content.gameConfig.name, "Local");
  assert.notEqual(triviaContent, undefined);
  assert.equal(triviaContent?.triviaPrompts[0]?.id, "local-1");
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
    "sample/gameConfig.json",
    createValidConfig("Sample")
  );
  writeContentFile(contentRoot, "sample/trivia.json", createValidTrivia("Sample"));

  const content = loadContent({ contentRootDir: contentRoot });
  const triviaContent = content.minigameContentById.TRIVIA;

  assert.equal(content.players[0]?.name, "Sample Player");
  assert.equal(content.gameConfig.name, "Sample");
  assert.notEqual(triviaContent, undefined);
  assert.equal(triviaContent?.triviaPrompts[0]?.id, "sample-1");
});

test("does not require trivia content when configured rounds do not include TRIVIA", () => {
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
    "sample/gameConfig.json",
    createValidConfig("Geo Pack", "GEO")
  );

  const content = loadContent({ contentRootDir: contentRoot });

  assert.equal(content.players[0]?.name, "Sample Player");
  assert.equal(content.gameConfig.rounds[0]?.minigame, "GEO");
  assert.equal(content.minigameContentById.TRIVIA, undefined);
  assert.equal(
    content.minigameContentById.GEO?.placeholderState,
    "No required content yet."
  );
});

test("fails fast with plugin context when configured trivia content is invalid", () => {
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
    "sample/gameConfig.json",
    createValidConfig("Trivia Pack", "TRIVIA")
  );
  writeContentFile(contentRoot, "sample/trivia.json", "{ invalid json");

  assert.throws(
    () => {
      loadContent({ contentRootDir: contentRoot });
    },
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /minigameId=TRIVIA/);
      assert.match(error.message, /trivia\.json/);
      assert.match(error.message, /Failed to parse trivia content/);
      return true;
    }
  );
});
