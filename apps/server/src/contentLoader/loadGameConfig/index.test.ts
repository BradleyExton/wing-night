import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { loadGameConfig } from "./index.js";

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
  questionsPerTurn?: number
): string => {
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
    ...(questionsPerTurn === undefined
      ? {}
      : {
          minigameRules: {
            trivia: {
              questionsPerTurn
            }
          }
        }),
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
    }
  });
};

test.after(() => {
  for (const dirPath of createdDirs) {
    rmSync(dirPath, { recursive: true, force: true });
  }
});

test("loads local game config content before sample fallback", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/gameConfig.json", createValidConfig("Local"));
  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidConfig("Sample")
  );

  const gameConfig = loadGameConfig({ contentRootDir: contentRoot });

  assert.equal(gameConfig.name, "Local");
});

test("falls back to sample game config content when local file is missing", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidConfig("Sample")
  );

  const gameConfig = loadGameConfig({ contentRootDir: contentRoot });

  assert.equal(gameConfig.name, "Sample");
});

test("throws when local game config content exists but is invalid", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/gameConfig.json",
    JSON.stringify({
      rounds: [{ round: 1 }]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidConfig("Sample")
  );

  assert.throws(
    () => {
      loadGameConfig({ contentRootDir: contentRoot });
    },
    /Invalid game config content/
  );
});

test("throws parse error when game config file is invalid JSON", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/gameConfig.json", "{ invalid json");

  assert.throws(
    () => {
      loadGameConfig({ contentRootDir: contentRoot });
    },
    /Failed to parse game config content/
  );
});

test("throws when both local and sample game config content files are missing", () => {
  const contentRoot = createContentRoot();

  assert.throws(
    () => {
      loadGameConfig({ contentRootDir: contentRoot });
    },
    /Missing game config content file/
  );
});

test("accepts optional trivia minigame rules in game config", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidConfig("Sample", 3)
  );

  const gameConfig = loadGameConfig({ contentRootDir: contentRoot });

  assert.equal(gameConfig.minigameRules?.trivia?.questionsPerTurn, 3);
});

test("throws when trivia minigame rules are invalid", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    JSON.stringify({
      name: "Invalid Trivia Rules",
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
      minigameRules: {
        trivia: {
          questionsPerTurn: 0
        }
      },
      timers: {
        eatingSeconds: 120,
        triviaSeconds: 30,
        geoSeconds: 45,
        drawingSeconds: 60
      }
    })
  );

  assert.throws(
    () => {
      loadGameConfig({ contentRootDir: contentRoot });
    },
    /Invalid game config content/
  );
});
