import assert from "node:assert/strict";
import test from "node:test";

import { loadContentFileWithFallback } from "./index.js";
import { createContentRoot, writeContentFile } from "../testHarness.js";

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
