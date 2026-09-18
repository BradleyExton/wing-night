import assert from "node:assert/strict";
import test from "node:test";

import { TEAM_COLOR_TOKENS } from "@wingnight/shared";

import {
  buildTeamColorVariantForTest,
  resolveCharacterFillClassName,
  resolveHashedTeamColorToken,
  resolveTeamColorVariant,
  resolveTeamColorVariantByToken,
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

test("does hand back the same bundle for a token as the id hash lands on when both name it", () => {
  const token = resolveHashedTeamColorToken("team-molten");

  assert.deepEqual(resolveTeamColorVariantByToken(token), resolveTeamColorVariant("team-molten"));
});

test("does keep every literal row in the table identical to the built shape when compared", () => {
  for (const token of TEAM_COLOR_TOKENS) {
    assert.deepEqual(resolveTeamColorVariantByToken(token), buildTeamColorVariantForTest(token));
  }
});

test("does set the tint variable off the token when a surface asks for it", () => {
  assert.equal(resolveTeamColorVariantByToken("teamD").tintClassName, "[--tint:theme(colors.teamD)]");
});
