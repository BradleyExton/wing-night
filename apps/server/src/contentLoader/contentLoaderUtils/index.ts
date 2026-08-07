import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolved ONCE, here, and exported as a value — never re-derived by each
// consumer from its own `import.meta.url`. The walk below is relative to THIS
// file's depth (`src/contentLoader/contentLoaderUtils/`), so a module that
// called it from a different depth would silently get a different root: a
// consumer one directory shallower lands on the repo's PARENT, happily
// `mkdirSync`s a `content/local/` there, and writes content nothing ever reads
// back. Exporting the computed value instead of the function that computes it
// removes that whole failure mode.
export const DEFAULT_CONTENT_ROOT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../content"
);

// Points the whole content lifecycle — every loader AND the writer — at a root
// other than the repo's own. It exists for the e2e suite: `config:apply` writes
// `<root>/local/gameConfig.json`, local wins over sample on the next read, and
// the write PERSISTS across processes, so a spec exercising the config wizard
// against the default root would permanently rewrite the content the rest of
// the suite asserts on. A teardown that restored the files was the other
// option; it was rejected because it leaks whenever a test fails mid-run,
// which is exactly when the suite is already red and hardest to read.
export const CONTENT_ROOT_DIR_ENV_KEY = "WN_CONTENT_ROOT_DIR";

// Read at CALL time rather than folded into DEFAULT_CONTENT_ROOT_DIR above,
// for two reasons: the constant's meaning ("this repo's content directory")
// stays true and testable, and a resolver taking its environment as an
// argument is directly testable without mutating `process.env`.
//
// Every `options.contentRootDir ?? ...` fallthrough in the server resolves
// through HERE, not through the constant — an override that only reached some
// consumers would be worse than none, because reads and writes would then
// disagree about which root they are talking about.
export const resolveContentRootDir = (
  environment: NodeJS.ProcessEnv = process.env
): string => {
  const configuredRootDir = environment[CONTENT_ROOT_DIR_ENV_KEY];

  if (typeof configuredRootDir !== "string" || configuredRootDir.trim().length === 0) {
    return DEFAULT_CONTENT_ROOT_DIR;
  }

  // Relative to the working directory the server was started from, which is
  // what a `WN_CONTENT_ROOT_DIR=.playwright/content` in a webServer env means.
  return resolve(configuredRootDir.trim());
};

export const parseContentJson = (
  rawContent: string,
  contentFilePath: string,
  contentLabel: string
): unknown => {
  try {
    return JSON.parse(rawContent) as unknown;
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse ${contentLabel} content at "${contentFilePath}": ${parseReason}`
    );
  }
};
