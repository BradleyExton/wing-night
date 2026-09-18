import assert from "node:assert/strict";
import test from "node:test";

import { resolveTeamApparel } from "./index";

test("does pick the genre's apparel when the team names a known genre", () => {
  assert.equal(resolveTeamApparel({ genre: "metal" }), "collar");
  assert.equal(resolveTeamApparel({ genre: "country" }), "hat");
  assert.equal(resolveTeamApparel({ genre: "pop" }), "shades");
  assert.equal(resolveTeamApparel({ genre: "disco" }), "lapels");
});

test("does match a genre loosely when it is cased or padded differently", () => {
  assert.equal(resolveTeamApparel({ genre: "  Heavy Metal " }), "collar");
  assert.equal(resolveTeamApparel({ genre: "Country & Western" }), "hat");
});

test("does dress nothing when the team has no genre or one nothing matches", () => {
  assert.equal(resolveTeamApparel({}), undefined);
  assert.equal(resolveTeamApparel({ genre: "   " }), undefined);
  assert.equal(resolveTeamApparel({ genre: "polka" }), undefined);
  assert.equal(resolveTeamApparel(undefined), undefined);
});
