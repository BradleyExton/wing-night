import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { loadContent } from "../contentLoader/index.js";
import {
  createContentRoot,
  writeValidContentTree
} from "../contentLoader/testHarness.js";
import { writeContentFiles } from "./index.js";

const readLocalFile = (contentRoot: string, fileName: string): unknown => {
  return JSON.parse(
    readFileSync(join(contentRoot, "local", fileName), "utf8")
  ) as unknown;
};

const validGameConfig = (
  name: string,
  minigameRules?: Record<string, unknown>
): Record<string, unknown> => {
  return {
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
    minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
    ...(minigameRules === undefined ? {} : { minigameRules }),
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
    }
  };
};

test("writes into content/local so the written file wins over sample on the next load", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");

  const result = writeContentFiles(
    [{ key: "players", value: { players: [{ name: "Written Player" }] } }],
    { contentRootDir: contentRoot }
  );

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(readLocalFile(contentRoot, "players.json"), {
    players: [{ name: "Written Player" }]
  });

  const reloaded = loadContent({ contentRootDir: contentRoot });
  assert.equal(reloaded.players[0]?.name, "Written Player");
});

test("leaves no temp file behind when a write succeeds", () => {
  const contentRoot = createContentRoot();

  writeContentFiles(
    [{ key: "teams", value: { teams: [{ name: "Written Team" }] } }],
    { contentRootDir: contentRoot }
  );

  const localFileNames = readdirSync(join(contentRoot, "local"));
  assert.deepEqual(localFileNames, ["teams.json"]);
});

test("refuses a payload its shared validator rejects and writes nothing", () => {
  const contentRoot = createContentRoot();

  const result = writeContentFiles(
    [{ key: "players", value: { players: [{ name: "" }] } }],
    { contentRootDir: contentRoot }
  );

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.ok || result.reason !== "invalid" ? [] : result.issues,
    [{ path: "players.players[0].name", message: "must be a non-empty string" }]
  );
  assert.equal(existsSync(join(contentRoot, "local", "players.json")), false);
});

// The seam AC2 exists for: `validateGameConfigFile` called bare does not check
// `minigameRules` at all, so this payload passes the shape validator. Only the
// plugin-backed rules check refuses it — and if it were not wired up, the file
// would land and fatal every subsequent boot.
test("refuses a gameConfig whose minigameRules the owning plugin rejects", () => {
  const contentRoot = createContentRoot();

  const result = writeContentFiles(
    [
      {
        key: "gameConfig",
        value: validGameConfig("Rejected", { trivia: { questionsPerTurn: 0 } })
      }
    ],
    { contentRootDir: contentRoot }
  );

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.ok || result.reason !== "invalid" ? [] : result.issues,
    [
      {
        path: "gameConfig.minigameRules.trivia",
        message: "failed the owning minigame's rules validation"
      }
    ]
  );
  assert.equal(existsSync(join(contentRoot, "local", "gameConfig.json")), false);
});

test("accepts a gameConfig whose minigameRules the owning plugin accepts", () => {
  const contentRoot = createContentRoot();

  const result = writeContentFiles(
    [
      {
        key: "gameConfig",
        value: validGameConfig("Accepted", { trivia: { questionsPerTurn: 3 } })
      }
    ],
    { contentRootDir: contentRoot }
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(existsSync(join(contentRoot, "local", "gameConfig.json")), true);
});

test("writes nothing at all when one file in a batch is invalid", () => {
  const contentRoot = createContentRoot();

  const result = writeContentFiles(
    [
      { key: "teams", value: { teams: [{ name: "Good Team" }] } },
      { key: "players", value: { players: [{ name: "" }] } }
    ],
    { contentRootDir: contentRoot }
  );

  assert.equal(result.ok, false);
  assert.equal(existsSync(join(contentRoot, "local", "teams.json")), false);
});

// A validation rejection and an unwritable disk are different failures and the
// wizard shows them differently, so the writer distinguishes them rather than
// collapsing both into "something went wrong".
test("reports a write failure distinctly from a validation failure", () => {
  const contentRoot = createContentRoot();
  // A file where the `local` directory needs to be: mkdir fails with ENOTDIR.
  writeFileSync(join(contentRoot, "local"), "not a directory", "utf8");

  const result = writeContentFiles(
    [{ key: "teams", value: { teams: [{ name: "Blocked" }] } }],
    { contentRootDir: contentRoot }
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok ? "" : result.reason, "writeFailed");
});

test("creates nested content directories for a minigame pack", () => {
  const contentRoot = createContentRoot();

  const result = writeContentFiles(
    [
      {
        key: "trivia",
        value: { prompts: [{ id: "t-1", question: "Q?", answer: "A" }] }
      }
    ],
    { contentRootDir: contentRoot }
  );

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(readLocalFile(contentRoot, "minigames/trivia.json"), {
    prompts: [{ id: "t-1", question: "Q?", answer: "A" }]
  });
});
