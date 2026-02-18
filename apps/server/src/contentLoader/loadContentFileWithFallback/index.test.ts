import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { loadContentFileWithFallback } from "./index.js";

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

test("loads local content file when present", () => {
  const contentRoot = createContentRoot();
  const parseCalls: string[] = [];

  writeContentFile(contentRoot, "local/players.json", "local-content");
  writeContentFile(contentRoot, "sample/players.json", "sample-content");

  const loaded = loadContentFileWithFallback({
    contentRootDir: contentRoot,
    contentFileName: "players.json",
    contentLabel: "players",
    parseFileContent: (rawContent, contentFilePath) => {
      parseCalls.push(contentFilePath);
      return rawContent;
    }
  });

  assert.equal(loaded, "local-content");
  assert.ok(parseCalls[0]?.endsWith("/local/players.json"));
});

test("falls back to sample content file when local is missing", () => {
  const contentRoot = createContentRoot();
  const parseCalls: string[] = [];

  writeContentFile(contentRoot, "sample/players.json", "sample-content");

  const loaded = loadContentFileWithFallback({
    contentRootDir: contentRoot,
    contentFileName: "players.json",
    contentLabel: "players",
    parseFileContent: (rawContent, contentFilePath) => {
      parseCalls.push(contentFilePath);
      return rawContent;
    }
  });

  assert.equal(loaded, "sample-content");
  assert.ok(parseCalls[0]?.endsWith("/sample/players.json"));
});

test("throws when both local and sample content files are missing", () => {
  const contentRoot = createContentRoot();

  assert.throws(
    () => {
      loadContentFileWithFallback({
        contentRootDir: contentRoot,
        contentFileName: "players.json",
        contentLabel: "players",
        parseFileContent: (rawContent) => rawContent
      });
    },
    /Missing players content file/
  );
});
