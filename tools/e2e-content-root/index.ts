import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  seedPlaceholderAnthems(resolve(contentRootDir, "sample"));

  return contentRootDir;
};

// The sample pack names an anthem per team but ships no audio — nobody's
// party clips belong in the repo — so under Playwright the TV's `<audio>`
// element pointed at a 404 and never actually played. That made every
// playback assertion trivially true: "paused at EATING" held because nothing
// had started. Each named anthem gets a generated silent WAV here instead
// (Chromium decodes WAV regardless of the `.mp3` name the pack uses), long
// enough that a spec can start it, fade it and stop it before it ends.
export const PLACEHOLDER_ANTHEM_SECONDS = 60;

const PLACEHOLDER_SAMPLE_RATE = 8000;

export const buildSilentWav = (seconds: number): Buffer => {
  const dataLength = Math.round(seconds * PLACEHOLDER_SAMPLE_RATE);
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(PLACEHOLDER_SAMPLE_RATE, 24);
  header.writeUInt32LE(PLACEHOLDER_SAMPLE_RATE, 28); // byte rate: 8-bit mono
  header.writeUInt16LE(1, 32); // block align
  header.writeUInt16LE(8, 34); // bits per sample
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataLength, 40);

  // 8-bit PCM is unsigned, so silence is the midpoint.
  return Buffer.concat([header, Buffer.alloc(dataLength, 0x80)]);
};

const readAnthemFileNames = (sampleDir: string): string[] => {
  const teamsFile = resolve(sampleDir, "teams.json");

  if (!existsSync(teamsFile)) {
    return [];
  }

  const parsed: unknown = JSON.parse(readFileSync(teamsFile, "utf8"));
  const teams =
    typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { teams?: unknown }).teams)
      ? ((parsed as { teams: unknown[] }).teams)
      : [];
  const fileNames = new Set<string>();

  for (const team of teams) {
    const anthems = (team as { anthems?: unknown }).anthems;

    if (!Array.isArray(anthems)) {
      continue;
    }

    for (const anthem of anthems) {
      if (typeof anthem === "string" && anthem.length > 0) {
        fileNames.add(anthem);
      }
    }
  }

  return [...fileNames];
};

export const seedPlaceholderAnthems = (sampleDir: string): string[] => {
  const fileNames = readAnthemFileNames(sampleDir);

  if (fileNames.length === 0) {
    return [];
  }

  const audioDir = resolve(sampleDir, "teams/audio");
  const wav = buildSilentWav(PLACEHOLDER_ANTHEM_SECONDS);

  mkdirSync(audioDir, { recursive: true });

  for (const fileName of fileNames) {
    writeFileSync(resolve(audioDir, fileName), wav);
  }

  return fileNames;
};
