import {
  CHARACTER_RAGDOLL_BODY,
  CHARACTER_RAGDOLL_SEGMENTS,
  type CharacterPivot,
  type CharacterRagdollSegmentPart,
  type CharacterRagdollTransform,
  type CharacterRagdollTransforms
} from "@wingnight/cast";
import { MOUNT_WORLD, type MountPose, type MountVec } from "@wingnight/shared";

// The sim hands over nine particles and no angles (spec §0.4: the referee is trig-free). The
// cast's figure wants each part's joint and its turn in degrees against rest (the convention at
// the top of `packages/cast/src/Character/ragdoll`). Nothing here is refereed, so this is where
// the angles are made, with `Math.atan2`, and only ever for drawing.
//
// The world is the bird box at scale 1 with y down, the same frame the cast draws in, so a
// particle's position IS a box position and no axis flips on the way through.

const DEGREES_PER_RADIAN = 180 / Math.PI;

const angleOf = (from: MountVec | CharacterPivot, to: MountVec | CharacterPivot): number => {
  return Math.atan2(to.y - from.y, to.x - from.x);
};

/** Degrees in (−180, 180], so a figure never spins the long way round between two frames. */
export const normaliseDegrees = (degrees: number): number => {
  let turned = degrees % 360;

  if (turned > 180) {
    turned -= 360;
  }

  if (turned <= -180) {
    turned += 360;
  }

  return turned;
};

const { rest } = MOUNT_WORLD.rig;

// The torso's own frame: its origin is the rump and its x axis runs to the neck. Every fixed point
// of the torso (the body's joint, both shoulders) is placed by turning its rest offset from the
// rump through the torso's angle.
const REST_TORSO_ANGLE = angleOf(rest.rump, rest.neck);

const placeOnTorso = (pose: MountPose, turn: number, restPoint: CharacterPivot): MountVec => {
  const dx = restPoint.x - rest.rump.x;
  const dy = restPoint.y - rest.rump.y;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);

  return { x: pose.rump.x + dx * cos - dy * sin, y: pose.rump.y + dx * sin + dy * cos };
};

// A segment's turn is the angle its bone makes now against the angle it makes at rest, joint to
// tip in both, which is exactly the cast's "zero is the part as `still` draws it".
const segment = (part: CharacterRagdollSegmentPart, joint: MountVec, tip: MountVec): CharacterRagdollTransform => {
  const { joint: restJoint, tip: restTip } = CHARACTER_RAGDOLL_SEGMENTS[part];
  const turn = angleOf(joint, tip) - angleOf(restJoint, restTip);

  return { x: joint.x, y: joint.y, rotation: normaliseDegrees(turn * DEGREES_PER_RADIAN) };
};

/**
 * One frozen or live pose as the cast's six part transforms. Legs hang off the hip particles,
 * the head off the neck, and the wings and the body off fixed points of the torso.
 */
export const resolveRagdollTransforms = (pose: MountPose): CharacterRagdollTransforms => {
  const torsoTurn = angleOf(pose.rump, pose.neck) - REST_TORSO_ANGLE;
  const bodyJoint = placeOnTorso(pose, torsoTurn, CHARACTER_RAGDOLL_BODY.joint);
  const wingRoot = placeOnTorso(pose, torsoTurn, CHARACTER_RAGDOLL_SEGMENTS.wingNear.joint);
  const wingFarRoot = placeOnTorso(pose, torsoTurn, CHARACTER_RAGDOLL_SEGMENTS.wingFar.joint);

  return {
    wingFar: segment("wingFar", wingFarRoot, pose.wingFar),
    legFar: segment("legFar", pose.hipRight, pose.footRight),
    body: { x: bodyJoint.x, y: bodyJoint.y, rotation: normaliseDegrees(torsoTurn * DEGREES_PER_RADIAN) },
    legNear: segment("legNear", pose.hipLeft, pose.footLeft),
    wingNear: segment("wingNear", wingRoot, pose.wing),
    head: segment("head", pose.neck, pose.beak)
  };
};

/** The SVG transform the cast's `RagdollPart` writes for a transform, character for character. */
export const formatRagdollTransform = ({ x, y, rotation }: CharacterRagdollTransform): string => {
  const round = (value: number): number => Math.round(value * 100) / 100;

  return `translate(${round(x)} ${round(y)}) rotate(${round(rotation)})`;
};
