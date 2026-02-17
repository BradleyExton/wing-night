import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { loadTrivia } from "./index.js";

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

const createValidTrivia = (prefix: string): string => {
  return JSON.stringify({
    prompts: [
      {
        id: `${prefix.toLowerCase()}-1`,
        question: `${prefix} question 1?`,
        answer: `${prefix} answer 1`
      },
      {
        id: `${prefix.toLowerCase()}-2`,
        question: `${prefix} question 2?`,
        answer: `${prefix} answer 2`
      }
    ]
  });
};

test.after(() => {
  for (const dirPath of createdDirs) {
    rmSync(dirPath, { recursive: true, force: true });
  }
});

test("loads local trivia content before sample fallback", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/trivia.json", createValidTrivia("Local"));
  writeContentFile(contentRoot, "sample/trivia.json", createValidTrivia("Sample"));

  const prompts = loadTrivia({ contentRootDir: contentRoot });

  assert.equal(prompts[0]?.id, "local-1");
});

test("falls back to sample trivia content when local file is missing", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/trivia.json", createValidTrivia("Sample"));

  const prompts = loadTrivia({ contentRootDir: contentRoot });

  assert.equal(prompts[0]?.id, "sample-1");
});

test("throws when local trivia content exists but is invalid", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/trivia.json",
    JSON.stringify({
      prompts: [{ id: "missing-fields" }]
    })
  );
  writeContentFile(contentRoot, "sample/trivia.json", createValidTrivia("Sample"));

  assert.throws(
    () => {
      loadTrivia({ contentRootDir: contentRoot });
    },
    /Invalid trivia content/
  );
});

test("throws when trivia content has duplicate prompt IDs", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/trivia.json",
    JSON.stringify({
      prompts: [
        { id: "duplicate", question: "Q1?", answer: "A1" },
        { id: "duplicate", question: "Q2?", answer: "A2" }
      ]
    })
  );

  assert.throws(
    () => {
      loadTrivia({ contentRootDir: contentRoot });
    },
    /Invalid trivia content/
  );
});

test("throws when trivia content has empty prompts array", () => {
  const contentRoot = createContentRoot();

  writeContentFile(
    contentRoot,
    "local/trivia.json",
    JSON.stringify({ prompts: [] })
  );

  assert.throws(
    () => {
      loadTrivia({ contentRootDir: contentRoot });
    },
    /Invalid trivia content/
  );
});

test("throws parse error when trivia content file is invalid JSON", () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/trivia.json", "{ invalid json");

  assert.throws(
    () => {
      loadTrivia({ contentRootDir: contentRoot });
    },
    /Failed to parse trivia content/
  );
});

test("throws when both local and sample trivia content files are missing", () => {
  const contentRoot = createContentRoot();

  assert.throws(
    () => {
      loadTrivia({ contentRootDir: contentRoot });
    },
    /Missing trivia content file/
  );
});
