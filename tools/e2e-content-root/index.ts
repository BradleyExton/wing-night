import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

// The throwaway content root the e2e stack runs against, and the seeding that
// makes it usable.
//
// Why it exists: `config:apply` writes `<root>/local/<file>.json`, local wins
// over sample on every subsequent read, and the write outlives the process. A
// spec that drives the config wizard against the repo's own `content/` would
// therefore permanently rewrite the round-1 values `host-display-sync.spec.ts`
// asserts on — and Playwright runs `workers: 1` / `fullyParallel: false` with
// specs ordered by filename, so an `admin-*` spec sorts FIRST and leaves the
// rest of the suite red. Isolating the root removes the shared resource
// instead of trying to restore it afterwards; a restoring teardown leaks
// whenever a test fails mid-run, which is precisely when the suite is already
// hard to read.
//
// Resolved against `process.cwd()` and NOT against this file's own location,
// which is the one thing worth explaining here. The obvious
// `import.meta.url` spelling cannot be used: Playwright transpiles the files it
// loads to CommonJS, `import.meta` is syntax that transform cannot convert, and
// Node then reparses the output as ESM and dies on "exports is not defined in
// ES module scope". Both callers — the Playwright config and the `node --test`
// script — run from the repo root, and a wrong root fails loudly on the
// `content/sample` check below rather than seeding somewhere silent.

const REPO_ROOT_DIR = process.cwd();

// Under the already-gitignored `.playwright/`, so a seeded root is never a
// candidate for accidental commit.
export const E2E_CONTENT_ROOT_DIR = resolve(REPO_ROOT_DIR, ".playwright/content");

const SAMPLE_SOURCE_DIR = resolve(REPO_ROOT_DIR, "content/sample");

// Seeding is NOT optional. `loadContentFileWithFallback` checks `<root>/local`
// then `<root>/sample` and throws "Missing <label> content file" when neither
// exists; the server's boot takes the destructive `setRoomStateFatalError`
// path on that, so an empty root yields a stack that starts and then serves a
// Content Load Error to every spec.
export const seedE2eContentRoot = (
  contentRootDir: string = E2E_CONTENT_ROOT_DIR,
  sampleSourceDir: string = SAMPLE_SOURCE_DIR
): string => {
  if (!existsSync(sampleSourceDir)) {
    throw new Error(
      `Cannot seed the e2e content root: no sample content at "${sampleSourceDir}". ` +
        `Expected to be running from the repo root (cwd is "${process.cwd()}").`
    );
  }

  // Wiped rather than merged: a `local/` left behind by a previous run is the
  // exact cross-run bleed this root exists to prevent, and a stale `sample/`
  // would silently pin the suite to content the repo no longer ships.
  rmSync(contentRootDir, { recursive: true, force: true });
  mkdirSync(contentRootDir, { recursive: true });
  cpSync(sampleSourceDir, resolve(contentRootDir, "sample"), { recursive: true });

  return contentRootDir;
};
