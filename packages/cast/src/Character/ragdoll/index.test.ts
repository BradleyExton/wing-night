import assert from "node:assert/strict";
import test from "node:test";

import {
  CHARACTER_BODY,
  CHARACTER_FOOT,
  CHARACTER_LEG_STROKE_WIDTH,
  CHARACTER_PIVOTS
} from "../geometry/index.js";
import { CHARACTER_WING_PATH, legPath } from "../shapes/index.js";
import * as styles from "../styles.js";
import {
  CHARACTER_RAGDOLL_BODY,
  CHARACTER_RAGDOLL_LIMB_PARTS,
  CHARACTER_RAGDOLL_LIMBS,
  CHARACTER_RAGDOLL_PARTS,
  CHARACTER_RAGDOLL_SEGMENTS,
  resolveCharacterRagdollRest,
  type CharacterRagdollSegmentPart
} from "./index.js";

const SEGMENT_PARTS = CHARACTER_RAGDOLL_PARTS.filter(
  (part): part is CharacterRagdollSegmentPart => part !== "body"
);

// The width of the stroke each tip is painted in: the legs' own, or the
// house outline every filled part wears.
const OUTLINE_WIDTH = Number(styles.silhouette.match(/stroke-(\d+)/)?.[1]);

const tipStrokeWidth = (part: CharacterRagdollSegmentPart): number =>
  part === "legNear" || part === "legFar" ? CHARACTER_LEG_STROKE_WIDTH : OUTLINE_WIDTH;

// Every point a path names, curve handles included.
const vertices = (d: string): { x: number; y: number }[] => {
  const numbers = (d.match(/-?[\d.]+/g) ?? []).map(Number);
  const points: { x: number; y: number }[] = [];

  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }

  return points;
};

test("does reach each limb as far as its length within the stroke its tip is painted in", () => {
  assert.equal(OUTLINE_WIDTH, 2, "the house outline is the 2-unit stroke");

  for (const limb of CHARACTER_RAGDOLL_LIMBS) {
    const part = CHARACTER_RAGDOLL_LIMB_PARTS[limb];
    const { reach, length } = CHARACTER_RAGDOLL_SEGMENTS[part];

    assert.ok(reach > length, `${limb}: the paint reaches past the tip's centreline`);
    assert.ok(reach - length <= tipStrokeWidth(part), `${limb}: reach ${reach} strays from length ${length}`);
    assert.equal(reach, length + tipStrokeWidth(part) / 2, `${limb}: reach is the tip plus half its ink`);
  }
});

test("does measure every segment's length from its joint to its tip", () => {
  for (const part of SEGMENT_PARTS) {
    const { joint, tip, length } = CHARACTER_RAGDOLL_SEGMENTS[part];

    assert.equal(length, Math.hypot(tip.x - joint.x, tip.y - joint.y), part);
    assert.ok(length > 0, `${part} has a bone`);
  }
});

test("does hang every rig part from the rig's own pivot when the part is one the posed hen has", () => {
  assert.deepEqual(CHARACTER_RAGDOLL_BODY.joint, CHARACTER_PIVOTS.body);
  assert.deepEqual(CHARACTER_RAGDOLL_SEGMENTS.head.joint, CHARACTER_PIVOTS.head);
  assert.deepEqual(CHARACTER_RAGDOLL_SEGMENTS.wingNear.joint, CHARACTER_PIVOTS.wing);
  assert.deepEqual(CHARACTER_RAGDOLL_SEGMENTS.legNear.joint, CHARACTER_PIVOTS.legNear);
  assert.deepEqual(CHARACTER_RAGDOLL_SEGMENTS.legFar.joint, CHARACTER_PIVOTS.legFar);
});

test("does stand both feet on the cast's own foot line when at rest", () => {
  for (const part of ["legNear", "legFar"] as const) {
    const { joint, tip } = CHARACTER_RAGDOLL_SEGMENTS[part];
    const toes = vertices(legPath(joint));

    assert.equal(tip.y, CHARACTER_FOOT.y, `${part} stands on the foot line`);
    assert.ok(
      toes.some((point) => point.x === tip.x && point.y === tip.y),
      `${part}'s tip is a toe the leg actually draws`
    );
  }
});

test("does put the wing's tip on a feather the stock wing draws, and the far wing's on the same feather moved with it", () => {
  const near = CHARACTER_RAGDOLL_SEGMENTS.wingNear;
  const far = CHARACTER_RAGDOLL_SEGMENTS.wingFar;

  assert.ok(vertices(CHARACTER_WING_PATH).some((point) => point.x === near.tip.x && point.y === near.tip.y));
  assert.equal(far.tip.x - far.joint.x, near.tip.x - near.joint.x);
  assert.equal(far.tip.y - far.joint.y, near.tip.y - near.joint.y);
  assert.equal(far.length, near.length);
});

test("does map the four grabbing limbs onto the tips of four different segments, left foot behind right", () => {
  const parts = CHARACTER_RAGDOLL_LIMBS.map((limb) => CHARACTER_RAGDOLL_LIMB_PARTS[limb]);

  assert.equal(new Set(parts).size, 4);
  assert.ok(!parts.includes("wingFar" as CharacterRagdollSegmentPart), "the far wing is never grabbed with");
  assert.ok(
    CHARACTER_RAGDOLL_SEGMENTS[CHARACTER_RAGDOLL_LIMB_PARTS.footLeft].tip.x <
      CHARACTER_RAGDOLL_SEGMENTS[CHARACTER_RAGDOLL_LIMB_PARTS.footRight].tip.x
  );
});

test("does collide the body as the same blob JOUST puts in its lane", () => {
  assert.deepEqual(CHARACTER_RAGDOLL_BODY.centre, { x: CHARACTER_BODY.cx, y: CHARACTER_BODY.cy });
  assert.equal(CHARACTER_RAGDOLL_BODY.radius, CHARACTER_BODY.r);
});

test("does rest every part on its joint unturned and hand back fresh transforms when asked twice", () => {
  const rest = resolveCharacterRagdollRest();

  assert.deepEqual(Object.keys(rest).sort(), [...CHARACTER_RAGDOLL_PARTS].sort());
  assert.deepEqual(rest.body, { ...CHARACTER_RAGDOLL_BODY.joint, rotation: 0 });

  for (const part of SEGMENT_PARTS) {
    assert.deepEqual(rest[part], { ...CHARACTER_RAGDOLL_SEGMENTS[part].joint, rotation: 0 }, part);
  }

  rest.head.rotation = 90;
  assert.equal(resolveCharacterRagdollRest().head.rotation, 0);
});
