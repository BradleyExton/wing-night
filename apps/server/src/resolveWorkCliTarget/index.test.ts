import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import test from "node:test";

import { resolveWorkCliTarget } from "./index.js";

// Derived independently of the module under test, so this is a real comparison
// rather than the module agreeing with itself.
const canonicalRepoRoot = (): string => {
  return dirname(
    execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8"
    }).trim()
  );
};

const withWorkCliEnv = (value: string | undefined, run: () => void): void => {
  const previous = process.env.WORK_CLI;

  if (value === undefined) {
    delete process.env.WORK_CLI;
  } else {
    process.env.WORK_CLI = value;
  }

  try {
    run();
  } finally {
    if (previous === undefined) {
      delete process.env.WORK_CLI;
    } else {
      process.env.WORK_CLI = previous;
    }
  }
};

test("uses the WORK_CLI override when it is set", () => {
  withWorkCliEnv("/somewhere/else/work.ts", () => {
    assert.equal(resolveWorkCliTarget().cliPath, "/somewhere/else/work.ts");
  });
});

test("trims a padded WORK_CLI override", () => {
  withWorkCliEnv("  /somewhere/else/work.ts  ", () => {
    assert.equal(resolveWorkCliTarget().cliPath, "/somewhere/else/work.ts");
  });
});

test("falls back to the sibling checkout when WORK_CLI is unset", () => {
  withWorkCliEnv(undefined, () => {
    assert.equal(
      resolveWorkCliTarget().cliPath,
      resolve(canonicalRepoRoot(), "../claude-dev-system/tools/bin/work.ts")
    );
  });
});

test("falls back to the sibling checkout when WORK_CLI is only whitespace", () => {
  withWorkCliEnv("   ", () => {
    assert.match(resolveWorkCliTarget().cliPath, /claude-dev-system\/tools\/bin\/work\.ts$/);
  });
});

// AC#1's worktree property, and the reason cwd is part of this module's answer
// at all: from a `.claude/worktrees/*` build checkout the canonical root and
// `process.cwd()` are different directories with their own `.work/tickets`, so
// spawning in the wrong one renders a different work-log than was resolved.
test("spawns in the canonical repo root rather than the current directory", () => {
  withWorkCliEnv(undefined, () => {
    assert.equal(resolveWorkCliTarget().cwd, canonicalRepoRoot());
  });
});

// The override changes WHICH CLI runs, never WHERE it runs.
test("keeps the canonical cwd even when the CLI path is overridden", () => {
  withWorkCliEnv("/somewhere/else/work.ts", () => {
    assert.equal(resolveWorkCliTarget().cwd, canonicalRepoRoot());
  });
});
