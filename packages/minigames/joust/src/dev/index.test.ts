import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateJoustContentFile } from "@wingnight/shared";

import { joustDevManifest } from "./index.js";

// The sandbox's lanes are a hand-copy, because `index.ts` is bundled for the browser and the
// sample pack is a file on the server's disk. The copy is free to drift and did: it stayed on the
// old eleven-seat lanes after the pack was re-authored, so /dev/minigame/joust showed a rack that
// had collapsed into the bare-ground fallback — the exact failure nobody would see until a party.
// This test does the import the bundle cannot, and is the only thing holding the two together.
const MODULE_ROOT = dirname(fileURLToPath(import.meta.url));
const SAMPLE_CONTENT: unknown = JSON.parse(
  readFileSync(
    join(MODULE_ROOT, "..", "..", "..", "..", "..", "content/sample/minigames/joust.json"),
    "utf8"
  )
);

test("does match the shipped sample pack when the sandbox deals its own lanes", () => {
  assert.deepEqual(joustDevManifest.content, SAMPLE_CONTENT);
});

// A second pair of eyes on the copy: even if both sides drifted together, lanes that fail content
// validation must never reach the sandbox, because the runtime would quietly rack them on sand.
test("does pass content validation when the sandbox's lanes are loaded", () => {
  assert.deepEqual(validateJoustContentFile(joustDevManifest.content), []);
});
