import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

// The work CLI lives in a SIBLING checkout — wing-night's vendored `tools/` has
// only the two hooks, no CLI.
const SIBLING_WORK_CLI_PATH = "../claude-dev-system/tools/bin/work.ts";

export type WorkCliTarget = {
  cliPath: string;
  // Where the CLI is spawned. Deliberately the canonical root rather than
  // `process.cwd()`: see `resolveCanonicalRepoRoot`.
  cwd: string;
};

// Resolves the CANONICAL repo root — the checkout that owns `.git` — rather than
// whichever checkout happens to be running. From a `.claude/worktrees/*` build
// checkout the two differ, and each carries its own independently mutable
// `.work/tickets`, so a cwd-relative answer would resolve the CLI against one
// work-log and render another.
const resolveCanonicalRepoRoot = (): string => {
  const gitCommonDir = execFileSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { encoding: "utf8" }
  ).trim();

  return dirname(gitCommonDir);
};

// Both halves of "how do I run the work CLI" in one answer, so no caller has to
// pair a path with a cwd itself and get the pairing wrong.
export const resolveWorkCliTarget = (): WorkCliTarget => {
  const canonicalRepoRoot = resolveCanonicalRepoRoot();
  const configuredCliPath = process.env.WORK_CLI;

  if (configuredCliPath !== undefined && configuredCliPath.trim().length > 0) {
    return { cliPath: configuredCliPath.trim(), cwd: canonicalRepoRoot };
  }

  return {
    cliPath: resolve(canonicalRepoRoot, SIBLING_WORK_CLI_PATH),
    cwd: canonicalRepoRoot
  };
};
