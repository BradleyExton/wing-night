import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { writeFileAtomically } from "./index.js";

test("does create the directory and leave only the finished file when text or bytes are written", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "wn-atomic-"));

  try {
    writeFileAtomically(join(rootDir, "a/b/players.json"), "{}\n");
    writeFileAtomically(join(rootDir, "a/b/head.png"), Uint8Array.of(137, 80, 78, 71));

    assert.equal(readFileSync(join(rootDir, "a/b/players.json"), "utf8"), "{}\n");
    assert.deepEqual([...readFileSync(join(rootDir, "a/b/head.png"))], [137, 80, 78, 71]);
    assert.deepEqual(readdirSync(join(rootDir, "a/b")).sort(), ["head.png", "players.json"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does remove the temp file and rethrow when the rename fails", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "wn-atomic-"));

  try {
    // A directory where the file should go: the write lands, the rename cannot.
    writeFileAtomically(join(rootDir, "taken/inner"), "x");

    assert.throws(() => writeFileAtomically(join(rootDir, "taken"), "y"));
    assert.deepEqual(readdirSync(rootDir), ["taken"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does rethrow the write's own error when cleaning up the temp path fails too", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "wn-atomic-"));
  const filePath = join(rootDir, "players.json");

  try {
    // A directory squatting on the temp path: the write fails, and so would rmSync on it.
    mkdirSync(`${filePath}.${process.pid}.tmp`);

    assert.throws(() => writeFileAtomically(filePath, "{}"), { code: "EISDIR" });
    assert.deepEqual(readdirSync(rootDir), [`players.json.${process.pid}.tmp`]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
