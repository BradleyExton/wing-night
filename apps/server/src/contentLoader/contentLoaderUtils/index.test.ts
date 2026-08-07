import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import test from "node:test";

import {
  CONTENT_ROOT_DIR_ENV_KEY,
  DEFAULT_CONTENT_ROOT_DIR,
  resolveContentRootDir
} from "./index.js";

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

// Every file the loaders fall back to must be reachable from the shared root,
// which is also the root the writer writes into — so a root that has these is
// the root that gets written to.
//
// Asserts against sample/ rather than calling `loadContent()`, deliberately:
// loadContent merges the gitignored, product-writable content/local/ on top,
// so a developer who had exercised the config wizard (or reproduced this
// ticket's own broken-local-content scenario) would get a red unit suite for
// reasons having nothing to do with their change.
test("has every content file the loaders fall back to", () => {
  const sampleFileNames = [
    "gameConfig.json",
    "players.json",
    "teams.json",
    "minigames/trivia.json",
    "minigames/geo.json",
    "minigames/drawing.json"
  ];

  for (const fileName of sampleFileNames) {
    assert.equal(
      existsSync(resolve(DEFAULT_CONTENT_ROOT_DIR, "sample", fileName)),
      true,
      `expected sample/${fileName} under ${DEFAULT_CONTENT_ROOT_DIR}`
    );
  }
});

// The override exists so the e2e suite can exercise `config:apply` — which
// writes `<root>/local/` and PERSISTS across processes — without rewriting the
// content the rest of the suite asserts on.
test("resolves the configured root when the content-root env var is set", () => {
  assert.equal(
    resolveContentRootDir({ [CONTENT_ROOT_DIR_ENV_KEY]: "/tmp/wingnight-content" }),
    "/tmp/wingnight-content"
  );
});

// A relative override means "relative to where the server was started", which
// is what a `WN_CONTENT_ROOT_DIR=.playwright/content` in a webServer env is.
test("resolves a relative override against the working directory", () => {
  assert.equal(
    resolveContentRootDir({ [CONTENT_ROOT_DIR_ENV_KEY]: ".playwright/content" }),
    resolve(".playwright/content")
  );
});

test("falls back to the repo's content directory when the env var is unset", () => {
  assert.equal(resolveContentRootDir({}), DEFAULT_CONTENT_ROOT_DIR);
});

// An empty or whitespace-only value is what an unset shell variable expands to
// in a `WN_CONTENT_ROOT_DIR=$SOMETHING` invocation. Treating it as "configured"
// would resolve the root to the working directory itself, so the loaders would
// look for `./local/` and `./sample/`, find neither, and fatal the boot with a
// message pointing at a directory nobody chose.
test("falls back to the default when the env var is blank", () => {
  assert.equal(
    resolveContentRootDir({ [CONTENT_ROOT_DIR_ENV_KEY]: "   " }),
    DEFAULT_CONTENT_ROOT_DIR
  );
});
