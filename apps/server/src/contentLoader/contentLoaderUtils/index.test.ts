import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import test from "node:test";

import { validateRosterAssignments } from "@wingnight/shared";

import {
  CONTENT_ROOT_DIR_ENV_KEY,
  DEFAULT_CONTENT_PACK_DIR,
  DEFAULT_CONTENT_ROOT_DIR,
  resolveContentLayerDirs,
  resolveContentRootDir
} from "./index.js";

const noDirectory = (): boolean => false;
const everyDirectory = (): boolean => true;

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

// The configured root wins over a pack that is sitting right there, which is
// what keeps the e2e stack off the real content: its seeded root is set in the
// Playwright webServer env and nothing about this machine can override it.
test("prefers the configured root over the pack when both are available", () => {
  assert.equal(
    resolveContentRootDir(
      { [CONTENT_ROOT_DIR_ENV_KEY]: ".playwright/content" },
      everyDirectory
    ),
    resolve(".playwright/content")
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

// The pack is the default with no env var and no setup, which is the whole
// reason a fresh worktree can run `pnpm dev` and see the real roster.
test("resolves the night pack when the env var is unset and the pack is there", () => {
  assert.equal(resolveContentRootDir({}, everyDirectory), DEFAULT_CONTENT_PACK_DIR);
});

test("falls back to the repo's content directory when there is no pack", () => {
  assert.equal(resolveContentRootDir({}, noDirectory), DEFAULT_CONTENT_ROOT_DIR);
});

// An empty or whitespace-only value is what an unset shell variable expands to
// in a `WN_CONTENT_ROOT_DIR=$SOMETHING` invocation. Treating it as "configured"
// would resolve the root to the working directory itself, so the loaders would
// look for `./local/` and `./sample/`, find neither, and fatal the boot with a
// message pointing at a directory nobody chose.
test("falls back to the default when the env var is blank", () => {
  assert.equal(
    resolveContentRootDir({ [CONTENT_ROOT_DIR_ENV_KEY]: "   " }, noDirectory),
    DEFAULT_CONTENT_ROOT_DIR
  );
});

test("orders an ordinary root as local then sample", () => {
  assert.deepEqual(resolveContentLayerDirs("/tmp/wingnight-root", "/tmp/wingnight-pack"), [
    resolve("/tmp/wingnight-root/local"),
    resolve("/tmp/wingnight-root/sample")
  ]);
});

// The pack lives outside the repo and carries only what a party customises, so
// the committed sample pack is its floor — otherwise the first file it does not
// carry (gameConfig.json) fatals the boot.
test("appends the repo's sample pack as a floor when the root is the night pack", () => {
  assert.deepEqual(resolveContentLayerDirs("/tmp/wingnight-pack", "/tmp/wingnight-pack"), [
    resolve("/tmp/wingnight-pack/local"),
    resolve("/tmp/wingnight-pack/sample"),
    resolve(DEFAULT_CONTENT_ROOT_DIR, "sample")
  ]);
});

// Constraint on the e2e suite, asserted rather than assumed: its seeded root is
// self-contained, so no layer of it can reach the real pack even if the seed
// were to fail.
test("keeps a seeded e2e root off the pack entirely", () => {
  const layerDirs = resolveContentLayerDirs(
    resolve(".playwright/content"),
    "/tmp/wingnight-pack"
  );

  assert.deepEqual(layerDirs, [
    resolve(".playwright/content/local"),
    resolve(".playwright/content/sample")
  ]);
});

// The committed pack is the party's default, and a player seated on a team that
// sample/teams.json does not declare fatals the boot of every fresh clone and
// worktree — where there is no content/local/ to mask it. Cheaper to catch here
// than at the party.
//
// Reads the two sample files directly, for the reason the fallback test above
// documents: `loadContent` merges a developer's gitignored local content and
// would make this red for reasons unrelated to the change under test.
test("seats every sample player on a team the sample pack declares", () => {
  const readSampleJson = (fileName: string): unknown =>
    JSON.parse(
      readFileSync(resolve(DEFAULT_CONTENT_ROOT_DIR, "sample", fileName), "utf8")
    ) as unknown;

  const players = readSampleJson("players.json") as {
    players: { name: string; team?: string }[];
  };
  const teams = readSampleJson("teams.json") as { teams: { name: string }[] };

  assert.deepEqual(validateRosterAssignments(players, teams), []);
});
