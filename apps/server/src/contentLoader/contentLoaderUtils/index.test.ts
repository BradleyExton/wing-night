import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import test from "node:test";

import { loadContent } from "../index.js";
import { DEFAULT_CONTENT_ROOT_DIR } from "./index.js";

// This root was previously re-derived inside every consumer from its own
// `import.meta.url` against a fixed five-level walk, so it only landed on the
// repo for a module sitting exactly two directories below `src`. The write
// path sat one directory below and silently resolved to the repo's PARENT:
// `config:save` created a `content/local/` outside the repo and reported
// success, while the read path went on loading the untouched real files — so
// `config:apply` re-seeded stale content and broadcast a no-change snapshot.
// Resolving it once and exporting the value is what makes that unrepresentable.
test("resolves to the repo's own content directory", () => {
  assert.equal(basename(DEFAULT_CONTENT_ROOT_DIR), "content");
  assert.equal(
    existsSync(resolve(DEFAULT_CONTENT_ROOT_DIR, "sample")),
    true,
    `expected a sample/ directory under ${DEFAULT_CONTENT_ROOT_DIR}`
  );
});

// The read side, exercised through its real default rather than an injected
// root — the writer resolves its target from this same constant, so a root
// that loads here is the root that is written to.
test("is a content root the loaders can actually load from by default", () => {
  const content = loadContent();

  assert.ok(content.gameConfig.rounds.length > 0);
  assert.ok(content.players.length > 0);
});
