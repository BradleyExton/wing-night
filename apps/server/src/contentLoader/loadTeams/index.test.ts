import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { loadTeams } from "./index.js";

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

test("loads local preset teams with generated ids and empty rosters", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/teams.json",
    JSON.stringify({
      teams: [{ name: "Local Team A" }, { name: "Local Team B" }]
    })
  );
  const teams = loadTeams({ contentRootDir: contentRoot });

  assert.deepEqual(teams, [
    { id: "team-1", name: "Local Team A", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Local Team B", playerIds: [], totalScore: 0 }
  ]);
});

test("falls back to sample teams when local teams content is missing", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "sample/teams.json",
    JSON.stringify({
      teams: [{ name: "Sample Team" }]
    })
  );

  const teams = loadTeams({ contentRootDir: contentRoot });

  assert.deepEqual(teams, [
    { id: "team-1", name: "Sample Team", playerIds: [], totalScore: 0 }
  ]);
});

test("throws when local preset teams content exists but is invalid", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/teams.json",
    JSON.stringify({
      teams: [{ label: "Missing Name" }]
    })
  );
  assert.throws(
    () => {
      loadTeams({ contentRootDir: contentRoot });
    },
    /Invalid teams content/
  );
});

test("throws parse error when local teams content file is invalid JSON", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/teams.json", "{ invalid json");

  assert.throws(
    () => {
      loadTeams({ contentRootDir: contentRoot });
    },
    /Failed to parse teams content/
  );
});

test("throws when both local and sample teams content files are missing", () => {
  const contentRoot = createContentRoot();

  assert.throws(
    () => {
      loadTeams({ contentRootDir: contentRoot });
    },
    /Missing teams content file/
  );
});
