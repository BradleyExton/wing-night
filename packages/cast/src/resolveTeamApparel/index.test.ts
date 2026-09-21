import assert from "node:assert/strict";
import test from "node:test";

import { resolveTeamApparel } from "./index.js";
import { resolveTeamSilhouette } from "../resolveTeamSilhouette/index.js";

test("does pick the genre's apparel when the team names a known genre", () => {
  assert.equal(resolveTeamApparel({ genre: "pop" }), "shades");
});

test("does match a genre loosely when it is cased or padded differently", () => {
  assert.equal(resolveTeamApparel({ genre: "  Synth Pop " }), "shades");
});

test("does dress nothing when the team has no genre or one nothing matches", () => {
  assert.equal(resolveTeamApparel({}), undefined);
  assert.equal(resolveTeamApparel({ genre: "   " }), undefined);
  assert.equal(resolveTeamApparel({ genre: "polka" }), undefined);
  assert.equal(resolveTeamApparel(undefined), undefined);
});

test("does dress a genre through the shared vocabulary so synthwave wears pop's shades", () => {
  assert.equal(resolveTeamApparel({ genre: "hip hop" }), undefined);
});

// The rule the two resolvers exist to keep: a genre states itself ONCE. A bird
// that is shaped does not also carry a prop, because the two are the same
// message a few units apart and the prop wins an argument nobody wanted. This
// is asserted over the whole genre vocabulary rather than per genre, so adding
// a genre to one table and forgetting the other fails here.
test("does give a genre a shape or a prop but never both", () => {
  for (const genre of ["metal", "punk", "rock", "pop", "country", "disco", "funk", "polka"]) {
    const dressed = resolveTeamApparel({ genre }) !== undefined;
    const shaped = resolveTeamSilhouette({ genre }) !== undefined;

    assert.ok(!(dressed && shaped), `${genre} is both shaped and dressed`);
  }
});
