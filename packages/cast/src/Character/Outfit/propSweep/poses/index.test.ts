import assert from "node:assert/strict";
import test from "node:test";

import { applySweepMatrix, type SweepPoint } from "../index.js";
import { resolvePropSweepFault, resolvePropSweepPoses, type PropSweepPose } from "./index.js";

const labels = (genre: string): string[] => resolvePropSweepPoses(genre).map((pose) => pose.label);

// The point of the drawing that this pose's Prop layer carries to `target`.
const drawnAt = (pose: PropSweepPose, target: SweepPoint): SweepPoint => {
  const [a, b, c, d, e, f] = pose.prop;
  const det = a * d - b * c;

  return [(d * (target[0] - e) - c * (target[1] - f)) / det, (-b * (target[0] - e) + a * (target[1] - f)) / det];
};

const find = (genre: string, label: string): PropSweepPose => {
  const pose = resolvePropSweepPoses(genre).find((candidate) => candidate.label === label);

  assert.ok(pose !== undefined, `no sweep pose "${label}"`);

  return pose;
};

test("does sweep every shown pose and every dance's beat and jig extremes from the figure's own tables", () => {
  const swept = labels("metal");

  for (const label of [
    "still (wing 0°)",
    "idle (wing 0°)",
    "walk (wing -8°)",
    "flap dance (wing 0°)",
    "bounce dance (wing -26°, head -13°)",
    "headbang dance (wing 4°, head 38°)",
    "headbang dance (wing -26°, head 0°)",
    "flap dance (wing -62°, head -8°)"
  ]) {
    assert.ok(swept.includes(label), label);
  }

  assert.ok(!swept.some((label) => /^(ride|peck|hurt|ko)/.test(label)), "a game pose is never swept");
});

test("does sweep a rail's own Moves and the shared chicken dance, and no other rail's", () => {
  const swept = labels("pop");

  assert.ok(swept.some((label) => label.startsWith("heart-point at")));
  assert.ok(swept.some((label) => label.startsWith("chicken-dance at")));
  assert.ok(!swept.some((label) => label.startsWith("horns-pump at")));
  assert.ok(labels("disco").some((label) => label.startsWith("the-bump-answer at")));
});

test("does park the Prop on the body for every frame the wing is flipped", () => {
  const parked = resolvePropSweepPoses("shared").filter((pose) => pose.kind === "parked");

  assert.ok(parked.some((pose) => pose.label === "chicken-dance at 81.25% (wing flipped)"));

  for (const pose of parked) {
    // The Prop's layer and the body's frame agree: no turn, nudge or mirror of the wing's.
    pose.prop.forEach((value, index) => assert.ok(Math.abs(value - (pose.frame[index] ?? Number.NaN)) < 1e-9, pose.label));
  }
});

test("does let a prop pass behind the head at a dance's wing beat but not stand in the head box at rest", () => {
  const flap = find("metal", "flap dance (wing -62°, head 0°)");

  assert.equal(resolvePropSweepFault([drawnAt(flap, [50, 10])], flap), undefined);
  assert.equal(resolvePropSweepFault([[50, 20]], find("metal", "still (wing 0°)"))?.rule, "head");
});

test("does fault a prop that crosses forward of the face at a Move's extreme", () => {
  const pose = find("metal", "horns-pump at 25.00%");

  // In front of the face as the head has turned it, and behind it.
  assert.equal(resolvePropSweepFault([drawnAt(pose, applySweepMatrix(pose.frame, [86, 20]))], pose)?.rule, "face");
  assert.equal(resolvePropSweepFault([drawnAt(pose, applySweepMatrix(pose.frame, [70, 20]))], pose), undefined);
});

test("does fault a point at rest in the face-forward corner, right of x 64 above y 40", () => {
  const still = find("metal", "still (wing 0°)");

  assert.equal(resolvePropSweepFault([[66, 39]], still)?.rule, "face");
  assert.equal(resolvePropSweepFault([[66, 41]], still), undefined);
});

test("does let a strict pose touch the floor but never go through it, and a soft one dip four units", () => {
  const still = find("metal", "still (wing 0°)");

  assert.equal(resolvePropSweepFault([[20, 72.75]], still), undefined);
  assert.equal(resolvePropSweepFault([[20, 72.8]], still)?.rule, "floor");
});
