import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateJoustContentFile } from "../index.js";
import {
  JOUST_SHOOTER_PROFILE_RANGES,
  isJoustShooter,
  validateJoustShooter,
  validateJoustShooterProfile,
  validateJoustShooters
} from "./index.js";

const validKind = {
  id: "log",
  name: "The Log",
  blurb: "Big, slow, heavy.",
  color: { fill: "#8b5a2b", dark: "#4a2c12", light: "#c48b55" },
  usesPerTurn: 1,
  profile: { shaftRadius: 3.4, headRadius: 4.8, launchSpeedScale: 0.65 }
};

const MODULE_ROOT = dirname(fileURLToPath(import.meta.url));
const SHIPPED_FILE: unknown = JSON.parse(
  readFileSync(
    join(MODULE_ROOT, "..", "..", "..", "..", "..", "..", "content/sample/minigames/joust.json"),
    "utf8"
  )
);

test("accepts a kind with a colour, a ration and a partial profile", () => {
  assert.deepEqual(validateJoustShooter(validKind), []);
  assert.equal(isJoustShooter(validKind), true);
});

test("accepts a kind with no ration and no profile as unlimited and Standard", () => {
  const { usesPerTurn: _uses, profile: _profile, ...bare } = validKind;

  assert.deepEqual(validateJoustShooter(bare), []);
});

test("rejects a kind missing its name, blurb or id", () => {
  const issues = validateJoustShooter({ ...validKind, name: "", blurb: 3 });

  assert.deepEqual(
    issues.map((issue) => issue.path),
    ["name", "blurb"]
  );
});

test("rejects a colour that is not three #rrggbb inks", () => {
  assert.equal(validateJoustShooter({ ...validKind, color: "#8b5a2b" })[0]?.path, "color");
  assert.equal(
    validateJoustShooter({ ...validKind, color: { ...validKind.color, light: "tan" } })[0]?.path,
    "color.light"
  );
});

test("rejects a ration that is not a positive whole number", () => {
  for (const usesPerTurn of [0, -1, 1.5, "1"]) {
    assert.equal(
      validateJoustShooter({ ...validKind, usesPerTurn })[0]?.path,
      "usesPerTurn",
      `usesPerTurn ${String(usesPerTurn)} should be refused`
    );
  }
});

test("rejects a profile lever outside the band the integrator is sane over", () => {
  for (const [lever, [min, max]] of Object.entries(JOUST_SHOOTER_PROFILE_RANGES)) {
    assert.deepEqual(validateJoustShooterProfile({ [lever]: min }), [], `${lever} at its floor`);
    assert.deepEqual(validateJoustShooterProfile({ [lever]: max }), [], `${lever} at its ceiling`);
    assert.equal(
      validateJoustShooterProfile({ [lever]: max + 0.01 })[0]?.path,
      lever,
      `${lever} past its ceiling`
    );
    assert.equal(
      validateJoustShooterProfile({ [lever]: min - 0.01 })[0]?.path,
      lever,
      `${lever} under its floor`
    );
  }
});

test("rejects a profile lever that does not exist, so a typo cannot silently do nothing", () => {
  assert.equal(validateJoustShooterProfile({ launchSpeed: 1.2 })[0]?.path, "launchSpeed");
  assert.equal(validateJoustShooterProfile({ massShare: "heavy" })[0]?.path, "massShare");
});

test("accepts an absent loadout and rejects an empty or non-array one", () => {
  assert.deepEqual(validateJoustShooters(undefined), []);
  assert.equal(validateJoustShooters([])[0]?.path, "shooters");
  assert.equal(validateJoustShooters({ log: validKind })[0]?.path, "shooters");
});

test("rejects a second kind wearing the same id, and names where it is", () => {
  const issues = validateJoustShooters([validKind, { ...validKind, name: "The Other Log" }]);

  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.path, "shooters[1].id");
});

test("prefixes a bad kind's issues with its place in the loadout", () => {
  const issues = validateJoustShooters([validKind, { ...validKind, id: "pencil", profile: { slip: 2 } }]);

  assert.deepEqual(
    issues.map((issue) => issue.path),
    ["shooters[1].profile.slip"]
  );
});

test("does validate the loadout as part of the whole content file", () => {
  const prompts = (SHIPPED_FILE as { prompts: unknown[] }).prompts;

  assert.deepEqual(validateJoustContentFile({ prompts }), [], "a file with no loadout is fine");
  assert.equal(
    validateJoustContentFile({ prompts, shooters: [{ ...validKind, id: "" }] })[0]?.path,
    "shooters[0].id"
  );
});

test("does ship a sample loadout that validates, with unique ids", () => {
  assert.deepEqual(validateJoustContentFile(SHIPPED_FILE), []);

  const shooters = (SHIPPED_FILE as { shooters: { id: string }[] }).shooters;

  assert.equal(new Set(shooters.map((kind) => kind.id)).size, shooters.length);
  assert.ok(shooters.length >= 2, "the sample is the demonstration that the picker exists");
});
