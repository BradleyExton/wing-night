import assert from "node:assert/strict";
import test from "node:test";

import { loadGameConfig } from "./index.js";
import {
  createContentRoot,
  createValidGameConfigJson,
  writeContentFile
} from "../testHarness.js";

test("loads local game config content before sample fallback", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/gameConfig.json", createValidGameConfigJson("Local"));
  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidGameConfigJson("Sample")
  );

  const gameConfig = loadGameConfig({ contentRootDir: contentRoot });

  assert.equal(gameConfig.name, "Local");
});

test("falls back to sample game config content when local file is missing", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidGameConfigJson("Sample")
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
    createValidGameConfigJson("Sample")
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
    createValidGameConfigJson("Sample", { questionsPerTurn: 3 })
  );

  const gameConfig = loadGameConfig({ contentRootDir: contentRoot });

  assert.equal(gameConfig.minigameRules?.trivia?.questionsPerTurn, 3);
});

test("accepts optional setup preview round slot count in game config", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    createValidGameConfigJson("Sample", { setupPreviewRoundSlots: 8 })
  );

  const gameConfig = loadGameConfig({ contentRootDir: contentRoot });

  assert.equal(gameConfig.setupPreviewRoundSlots, 8);
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

  // Pins the whole message, not just the prefix: the generic shape-failure
  // throw from the same function also starts "Invalid game config content", so
  // a loose match would stay green if the rules half of it were dropped.
  assert.throws(
    () => {
      loadGameConfig({ contentRootDir: contentRoot });
    },
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(
        error.message,
        /^Invalid game config content at ".+": minigameRules\.trivia failed TRIVIA rules validation\.$/
      );
      return true;
    }
  );
});

// The rules seam walks the shared registry's own rules keys, never the config's.
// If it walked the config's keys instead, this file would start failing to boot.
test("ignores minigameRules entries that no minigame claims", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    JSON.stringify({
      name: "Unknown Rules Key",
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
        bogus: {
          anything: true
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

  const gameConfig = loadGameConfig({ contentRootDir: contentRoot });

  assert.equal(gameConfig.name, "Unknown Rules Key");
});

test("throws when setup preview round slot count is invalid", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    JSON.stringify({
      name: "Invalid Preview Slot Count",
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
      setupPreviewRoundSlots: 0,
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

test("throws when setup preview round slot count exceeds the maximum", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/gameConfig.json",
    JSON.stringify({
      name: "Too Many Preview Slots",
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
      setupPreviewRoundSlots: 1000,
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
