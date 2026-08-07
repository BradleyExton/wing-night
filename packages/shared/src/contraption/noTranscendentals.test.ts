import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/**
 * ECMA-262 leaves the precision of these implementation-defined, so two engines may return
 * different bits for the same input. A run recorded by the server would then fail to replay
 * identically in a browser, which is the whole risk behind WN-15's option (b).
 *
 * `Math.sqrt` is deliberately absent: IEEE-754 requires it to be correctly rounded, as it does the
 * four arithmetic operators — that pair is the entire numerical basis this integrator relies on.
 * `Math.random` is banned for the separate reason that it is not reproducible at all.
 */
const BANNED_MEMBERS = [
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "atan2",
  "sinh",
  "cosh",
  "tanh",
  "asinh",
  "acosh",
  "atanh",
  "exp",
  "expm1",
  "log",
  "log2",
  "log10",
  "log1p",
  "pow",
  "cbrt",
  "hypot",
  "random"
];

const MODULE_ROOT = dirname(fileURLToPath(import.meta.url));

/** Every shipped file in the module — the tests themselves are exempt and are excluded here. */
const collectSourceFiles = (directory: string): string[] => {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectSourceFiles(path));
      continue;
    }
    if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test-d.ts")
    ) {
      found.push(path);
    }
  }
  return found;
};

// Without this the scan below would pass vacuously if the walk ever stopped finding files — the
// exact way a source-scanning guard rots into a no-op.
test("walks the whole module rather than a single file", () => {
  const files = collectSourceFiles(MODULE_ROOT);

  assert.ok(
    files.some((path) => path.endsWith(join("simulate", "index.ts"))),
    `the integrator itself was not scanned: ${files.join(", ")}`
  );
  assert.ok(
    files.some((path) => path.includes(`${sep}resolveSegmentContacts${sep}`)),
    `nested modules were not scanned: ${files.join(", ")}`
  );
});

test("uses no implementation-defined Math member anywhere in the module", () => {
  const offences = collectSourceFiles(MODULE_ROOT).flatMap((path) => {
    const source = readFileSync(path, "utf8");
    return BANNED_MEMBERS.filter((member) => {
      return new RegExp(`Math\\s*\\.\\s*${member}\\b`).test(source);
    }).map((member) => `${path}: Math.${member}`);
  });

  assert.deepEqual(offences, []);
});
