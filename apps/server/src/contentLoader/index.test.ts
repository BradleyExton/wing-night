import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

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

const createValidConfig = (name: string): string => {
  return JSON.stringify({
    name,
    rounds: [
      {
        round: 1,
        label: "Warm Up",
        sauce: "Frank's",
        pointsPerPlayer: 2,
        minigame: "TRIVIA"
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

  assert.equal(content.players[0]?.name, "Local Player");
  assert.equal(content.gameConfig.name, "Local");
  assert.equal(content.triviaPrompts[0]?.id, "local-1");
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

  assert.equal(content.players[0]?.name, "Sample Player");
  assert.equal(content.gameConfig.name, "Sample");
  assert.equal(content.triviaPrompts[0]?.id, "sample-1");
});
