import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { test } from "node:test";

import { E2E_CONTENT_ROOT_DIR, seedE2eContentRoot } from "./index.ts";

const withTemporaryRoot = (run) => {
  const temporaryDir = mkdtempSync(resolve(tmpdir(), "wingnight-e2e-content-"));
  const contentRootDir = resolve(temporaryDir, "content");

  try {
    run(contentRootDir);
  } finally {
    rmSync(temporaryDir, { recursive: true, force: true });
  }
};

// Boot throws "Missing <label> content file" and takes the destructive
// fatalError path when neither local/ nor sample/ has the file, so an unseeded
// root produces a stack that starts and then serves a Content Load Error.
test("seeds every content file the loaders fall back to", () => {
  withTemporaryRoot((contentRootDir) => {
    seedE2eContentRoot(contentRootDir);

    for (const fileName of [
      "gameConfig.json",
      "players.json",
      "teams.json",
      "minigames/trivia.json",
      "minigames/geo.json",
      "minigames/drawing.json"
    ]) {
      assert.equal(
        existsSync(resolve(contentRootDir, "sample", fileName)),
        true,
        `expected sample/${fileName} in the seeded root`
      );
    }
  });
});

// The whole point of the isolated root: a `config:apply` write from a previous
// run must not decide what the next run reads, because local wins over sample.
test("clears a local/ directory left behind by a previous run", () => {
  withTemporaryRoot((contentRootDir) => {
    mkdirSync(resolve(contentRootDir, "local"), { recursive: true });
    writeFileSync(
      resolve(contentRootDir, "local/gameConfig.json"),
      '{"name":"stale"}\n',
      "utf8"
    );

    seedE2eContentRoot(contentRootDir);

    assert.equal(existsSync(resolve(contentRootDir, "local")), false);
  });
});

test("creates the root when it does not exist yet", () => {
  withTemporaryRoot((contentRootDir) => {
    assert.equal(existsSync(contentRootDir), false);

    seedE2eContentRoot(contentRootDir);

    assert.equal(existsSync(resolve(contentRootDir, "sample")), true);
  });
});

test("returns the root it seeded", () => {
  withTemporaryRoot((contentRootDir) => {
    assert.equal(seedE2eContentRoot(contentRootDir), contentRootDir);
  });
});

// `.playwright/` is gitignored, so a seeded root can never be committed by
// accident — and it is emphatically not the repo's own content/ directory,
// which is the resource this whole module exists to keep out of the suite's
// write path.
test("defaults to a gitignored root that is not the repo's content directory", () => {
  assert.match(E2E_CONTENT_ROOT_DIR, /\.playwright\/content$/);
  assert.equal(E2E_CONTENT_ROOT_DIR.endsWith("/content/sample"), false);
});

// The root is derived from the working directory, so being run from the wrong
// place has to fail loudly rather than seed an empty root somewhere silent —
// an empty root boots a server that then serves Content Load Error to the
// whole suite, which reads as a product bug rather than a harness one.
test("throws naming the missing source when the sample content is not where it should be", () => {
  withTemporaryRoot((contentRootDir) => {
    assert.throws(
      () => seedE2eContentRoot(contentRootDir, resolve(contentRootDir, "absent")),
      /Cannot seed the e2e content root/
    );
  });
});
