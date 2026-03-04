import assert from "node:assert/strict";
import test from "node:test";

import { resolveTeamColorVariant } from "./index";

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
