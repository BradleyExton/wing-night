import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveCharacterFillClassName,
  resolveTeamColorVariant,
  UNSEATED_CHARACTER_FILL_CLASS_NAME
} from "./index.js";

test("returns deterministic team color variants by id", () => {
  const firstPass = resolveTeamColorVariant("team-alpha");
  const secondPass = resolveTeamColorVariant("team-alpha");

  assert.deepEqual(firstPass, secondPass);
});

test("returns distinct team color variants across team ids", () => {
  const variantClasses = new Set(
    ["team-alpha", "team-beta", "team-gamma", "team-delta"].map((teamId) =>
      resolveTeamColorVariant(teamId).dotAccentClassName
    )
  );

  assert.ok(variantClasses.size > 1);
});

test("returns a safe fallback variant for empty team ids", () => {
  const variant = resolveTeamColorVariant("");

  assert.equal(typeof variant.borderAccentClassName, "string");
  assert.equal(typeof variant.dotAccentClassName, "string");
});

test("does paint a bird in its own team's colour, off the same table as its dot", () => {
  assert.equal(
    resolveCharacterFillClassName("team-molten"),
    resolveTeamColorVariant("team-molten").characterFillClassName
  );
});

test("does paint a player with no seat in the cast's warm neutral", () => {
  assert.equal(resolveCharacterFillClassName(null), UNSEATED_CHARACTER_FILL_CLASS_NAME);
  assert.equal(resolveCharacterFillClassName(""), UNSEATED_CHARACTER_FILL_CLASS_NAME);
});
