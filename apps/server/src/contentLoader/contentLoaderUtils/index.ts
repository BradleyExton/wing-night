import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
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

// The real night pack: one directory OUTSIDE the repo holding the roster, the
// team playlists, the generated heads and the GEO photos. It lives outside
// because every Claude session runs in its own git worktree and all of this is
// gitignored — kept in the repo it has to be re-copied into each worktree, and
// the copies drift. One directory, every checkout, no setup.
//
// Its layout is the `local/` layer of a content root (plus a `.env` for the
// offline import tools), so nothing about the loaders changes: `local/` wins
// over `sample/` here exactly as it does in the repo's own content directory.
export const DEFAULT_CONTENT_PACK_DIR = join(homedir(), "wing-night-content");

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
  environment: NodeJS.ProcessEnv = process.env,
  directoryExists: (path: string) => boolean = existsSync
): string => {
  const configuredRootDir = environment[CONTENT_ROOT_DIR_ENV_KEY];

  if (typeof configuredRootDir !== "string" || configuredRootDir.trim().length === 0) {
    // The pack is the default when it is actually there, which is what makes a
    // fresh worktree just work: no env var to set, no files to copy, and the
    // preview stacks in `.claude/launch.json` pick it up for free. A machine
    // without one (CI, a fresh clone) falls through to the repo's committed
    // sample content and still boots.
    return directoryExists(DEFAULT_CONTENT_PACK_DIR)
      ? DEFAULT_CONTENT_PACK_DIR
      : DEFAULT_CONTENT_ROOT_DIR;
  }

  // Relative to the working directory the server was started from, which is
  // what a `WN_CONTENT_ROOT_DIR=.playwright/content` in a webServer env means.
  return resolve(configuredRootDir.trim());
};

// The ordered layers a content read falls through, local-wins-first.
//
// The third layer is what lets the night pack live OUTSIDE the repo: the pack
// carries only what a party customises (roster, teams, party music, photos,
// heads), while `gameConfig.json` and the minigame prompt banks stay committed
// in `content/sample/` where they evolve with the code that reads them. Without
// that floor, pointing the root at the pack would fatal the boot on the first
// file the pack does not carry — and copying those files into the pack would
// freeze them at whatever the code wanted the day they were copied.
//
// It is added ONLY for the pack, not for every root, and that is deliberate on
// two counts. A temp root in a unit test and the e2e suite's seeded root are
// self-contained by design: their chain stays exactly [local, sample], so a
// missing file still fails loudly there, and the e2e stack provably cannot read
// the real pack no matter what the seed did. And the repo's own content root
// already IS the floor, so it would only ever dedupe against itself.
export const resolveContentLayerDirs = (
  contentRootDir: string,
  contentPackDir: string = DEFAULT_CONTENT_PACK_DIR
): string[] => {
  const layerDirs = [
    resolve(contentRootDir, "local"),
    resolve(contentRootDir, "sample")
  ];

  if (resolve(contentRootDir) === resolve(contentPackDir)) {
    layerDirs.push(resolve(DEFAULT_CONTENT_ROOT_DIR, "sample"));
  }

  return layerDirs;
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
