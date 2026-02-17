import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { loadPlayers } from "./index.js";

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

test.after(() => {
  for (const dirPath of createdDirs) {
    rmSync(dirPath, { recursive: true, force: true });
  }
});

test("loads local players content before sample fallback", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/players.json",
    JSON.stringify({
      players: [
        { name: "Alice", avatarSrc: "/avatars/alice.png" },
        { name: "Bob" }
      ]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/players.json",
    JSON.stringify({
      players: [{ name: "Sample Player" }]
    })
  );

  const players = loadPlayers({ contentRootDir: contentRoot });

  assert.deepEqual(players, [
    { id: "player-1", name: "Alice", avatarSrc: "/avatars/alice.png" },
    { id: "player-2", name: "Bob" }
  ]);
});

test("falls back to sample players content when local file is missing", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/players.json",
    JSON.stringify({
      players: [{ name: "Sample Player" }]
    })
  );

  const players = loadPlayers({ contentRootDir: contentRoot });

  assert.deepEqual(players, [{ id: "player-1", name: "Sample Player" }]);
});

test("throws when local players content exists but is invalid", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/players.json",
    JSON.stringify({
      players: [{ avatarSrc: "/avatars/missing-name.png" }]
    })
  );
  writeContentFile(
    contentRoot,
    "sample/players.json",
    JSON.stringify({
      players: [{ name: "Valid Sample Player" }]
    })
  );

  assert.throws(
    () => {
      loadPlayers({ contentRootDir: contentRoot });
    },
    /Invalid players content/
  );
});

test("throws parse error when players content file is invalid JSON", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/players.json", "{ invalid json");

  assert.throws(
    () => {
      loadPlayers({ contentRootDir: contentRoot });
    },
    /Failed to parse players content/
  );
});

test("throws when both local and sample players content files are missing", () => {
  const contentRoot = createContentRoot();

  assert.throws(
    () => {
      loadPlayers({ contentRootDir: contentRoot });
    },
    /Missing players content file/
  );
});
