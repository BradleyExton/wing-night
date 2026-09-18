import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/**
 * FAPPY re-runs the same sim on three machines — the tablet plays it, the server referees it,
 * the display mirrors it — from the same seed and flap log, and they have to land on the same
 * bits. ECMA-262 leaves these implementation-defined, so they are banned outright (the JOUST
 * rule; see its copy of this test for the numerical reasoning). `Math.imul`, `floor`, `ceil`,
 * `min`, `max` and the four operators are exact everywhere and are all the sim needs.
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
  "sqrt",
  "random"
];

const MODULE_ROOT = dirname(fileURLToPath(import.meta.url));

const collectSourceFiles = (directory: string): string[] => {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectSourceFiles(path));
      continue;
    }
    if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      found.push(path);
    }
  }
  return found;
};

test("walks the whole module rather than a single file", () => {
  const files = collectSourceFiles(MODULE_ROOT);

  assert.ok(
    files.some((path) => path.endsWith(join("simulate", "index.ts"))),
    `the sim itself was not scanned: ${files.join(", ")}`
  );
  assert.ok(
    files.some((path) => path.includes(`${sep}world${sep}`)),
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
