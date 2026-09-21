import assert from "node:assert/strict";
import test from "node:test";

import { resolveTeamDance, resolveTeamSilhouette } from "./index.js";

test("does shape a genre when the team names one the axis reaches", () => {
  assert.equal(resolveTeamSilhouette({ genre: "metal" }), "spiky");
  assert.equal(resolveTeamSilhouette({ genre: "country" }), "broody");
  assert.equal(resolveTeamSilhouette({ genre: "disco" }), "preener");
});

test("does share one shape across the genres at the same end of the axis", () => {
  // Punk and rock are metal's neighbours, not their own drawings — which is
  // also what retired the studded collar all three used to wear.
  assert.equal(resolveTeamSilhouette({ genre: "punk" }), "spiky");
  assert.equal(resolveTeamSilhouette({ genre: "rock" }), "spiky");
});

test("does match a genre loosely when it is cased or padded differently", () => {
  assert.equal(resolveTeamSilhouette({ genre: "  Heavy Metal " }), "spiky");
  assert.equal(resolveTeamSilhouette({ genre: "Country & Western" }), "broody");
});

test("does leave the stock bird when the team has no genre or one nothing matches", () => {
  assert.equal(resolveTeamSilhouette({}), undefined);
  assert.equal(resolveTeamSilhouette({ genre: "   " }), undefined);
  assert.equal(resolveTeamSilhouette({ genre: "polka" }), undefined);
  assert.equal(resolveTeamSilhouette(undefined), undefined);
});

test("does leave pop unshaped because pop is the origin of the axis", () => {
  // "Smooth, round, upright" is a description of the stock bird, so a pop
  // silhouette would draw the bird already shipping. Pop moves instead.
  assert.equal(resolveTeamSilhouette({ genre: "pop" }), undefined);
  assert.equal(resolveTeamDance({ genre: "pop" }), "bounce");
});

test("does leave the step to the player when the genre has no dance of its own", () => {
  assert.equal(resolveTeamDance({ genre: "metal" }), undefined);
  assert.equal(resolveTeamDance({ genre: "polka" }), undefined);
  assert.equal(resolveTeamDance(undefined), undefined);
});

test("does give every genre exactly one carrier so none of them reads as untreated", () => {
  // A genre the room cannot name is the failure this whole system exists to
  // prevent: either the bird is shaped, or it moves, or it wears something.
  for (const genre of ["metal", "punk", "rock", "pop", "country", "disco"]) {
    assert.ok(
      resolveTeamSilhouette({ genre }) !== undefined || resolveTeamDance({ genre }) !== undefined,
      `${genre} carries nothing`
    );
  }
});
