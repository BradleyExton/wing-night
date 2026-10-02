import {
  CHARACTER_BODY,
  CHARACTER_LEG_STROKE_WIDTH,
  CHARACTER_PIVOTS,
  DRAWN_BEAK_TIP,
  DRAWN_HEAD,
  type CharacterPivot
} from "../geometry/index.js";

// The hen as a ragdoll. A physics sim (Mount Your Hens) owns where every part
// of the bird is on every tick, and the surfaces draw the bird from those
// transforms instead of from a named pose (`CharacterRagdollFigure`). This
// module is the one place both sides read the bird's bones from, so the
// drawing and the physics are the same creature: the cast is the source of
// truth for every anchor here, and the sim builds its bodies off these numbers
// rather than measuring the drawing itself.
//
// Six rigid parts. Five carry the rig's own names because they ARE the rig's
// parts: `body`, `head` (neck and all), `legNear` and `legFar`, and `wingNear`,
// which is the rig's `wing`. The sixth, `wingFar`, is new: the posed hen draws
// one wing because it never shows the other, but a ragdoll flails, so the far
// wing hangs from a shoulder a little up and forward of the near one and is
// drawn behind everything. The tail has no joint of its own here; it rides on
// the body.
//
// Every number is in the bird box: the 80×72 box the still hen is drawn in,
// facing right, x to the right and y DOWN. All of them describe the bird at
// rest, standing exactly as `still` draws it.
//
// The transform convention (`CharacterRagdollTransform`), which the sim writes
// and the figure reads:
//
// - `x`, `y` are where the part's JOINT is, in bird-box units. The joint is the
//   point the part turns about: the hip for a leg, the shoulder for a wing, the
//   base of the neck for the head, and for the body the rig's own body pivot.
//   They are absolute, not relative to the body, so a sim hands over each
//   rigid body's joint as it finds it. They can lie anywhere: the box is a
//   unit, not a fence, and a surface scales or places the whole figure with a
//   transform of its own around it.
// - `rotation` is in degrees, clockwise on screen, which is the way SVG's
//   `rotate()` turns in a box whose y runs down. Zero is the part as `still`
//   draws it. It is absolute too: a leg at 0 hangs straight down whatever the
//   body is doing, so a sim hands over each body's own angle, never its angle
//   against the body.
//
// A sim whose world runs y UP flips the sign of both `y` and `rotation` on the
// way in. One whose bodies sit at their centres of mass rather than at their
// joints moves each point to the joint first; `joint`, `tip` and the body's
// `centre` below are what it needs to do that.

export const CHARACTER_RAGDOLL_PARTS = ["wingFar", "legFar", "body", "legNear", "wingNear", "head"] as const;
export type CharacterRagdollPart = (typeof CHARACTER_RAGDOLL_PARTS)[number];

// The five parts that hang off the body, each a straight bone from its joint
// to its tip.
export type CharacterRagdollSegmentPart = Exclude<CharacterRagdollPart, "body">;

export type CharacterRagdollSegment = {
  /** Where the part hangs off the body at rest: its turning point, in the box. */
  joint: CharacterPivot;
  /** The far end of the bone at rest, in the box, and the point a limb grabs with. */
  tip: CharacterPivot;
  /** Joint to tip. */
  length: number;
  /** How wide the part is drawn across its joint-to-tip line: a capsule collider's diameter. */
  thickness: number;
  /** Joint to the painted end of the tip: the length plus the ink drawn past the tip's centreline. */
  reach: number;
};

// The house outline (`styles.silhouette`, `stroke-2`): a filled part's paint
// reaches half of it past its own edge, the beak's and the wing's tips included.
const OUTLINE_WIDTH = 2;

// The far wing's shoulder, measured from the near one's. Up and forward so its
// top edge clears the near wing when both are raised, and small enough that at
// rest every part of it sits behind the stock body (a genre `preener`, whose
// body is the narrowest, shows a sliver of it under its near wing).
const FAR_WING_OFFSET = { x: 4, y: -2 } as const;

// The stock wing's first feather tip, a vertex of `CHARACTER_WING_PATH`: the
// end of the wing a flailing bird reaches out with.
const WING_TIP = { x: 24, y: 55 } as const;

// The middle toe, `legPath`'s `y + 14` below the hip: the foot stands on it.
const TOE_DROP = 14;

const segment = (joint: CharacterPivot, tip: CharacterPivot, thickness: number, tipInk: number): CharacterRagdollSegment => {
  const length = Math.hypot(tip.x - joint.x, tip.y - joint.y);

  return { joint, tip, length, thickness, reach: length + tipInk / 2 };
};

const leg = (hip: CharacterPivot): CharacterRagdollSegment =>
  segment(hip, { x: hip.x, y: hip.y + TOE_DROP }, CHARACTER_LEG_STROKE_WIDTH, CHARACTER_LEG_STROKE_WIDTH);

// Measured across the stock wing's joint-to-tip line (23.8 units at its widest).
const WING_THICKNESS = 24;

// The head's bone runs from the base of the neck to the point of the beak. A
// costume head has no beak, so on a real night the tip is the front edge of the
// player's photo at mouth height, which is where the room sees the face. The
// head's thickness is the drawn head's diameter; a sim that wants the head to
// collide as a head gives it a ball at `CHARACTER_HEAD_CENTRE` of
// `CHARACTER_HEAD_RADIUS`, carried on this bone.
const HEAD_THICKNESS = DRAWN_HEAD.r * 2;

export const CHARACTER_RAGDOLL_SEGMENTS: Record<CharacterRagdollSegmentPart, CharacterRagdollSegment> = {
  wingFar: segment(
    { x: CHARACTER_PIVOTS.wing.x + FAR_WING_OFFSET.x, y: CHARACTER_PIVOTS.wing.y + FAR_WING_OFFSET.y },
    { x: WING_TIP.x + FAR_WING_OFFSET.x, y: WING_TIP.y + FAR_WING_OFFSET.y },
    WING_THICKNESS,
    OUTLINE_WIDTH
  ),
  legFar: leg(CHARACTER_PIVOTS.legFar),
  legNear: leg(CHARACTER_PIVOTS.legNear),
  wingNear: segment(CHARACTER_PIVOTS.wing, WING_TIP, WING_THICKNESS, OUTLINE_WIDTH),
  head: segment(CHARACTER_PIVOTS.head, DRAWN_BEAK_TIP, HEAD_THICKNESS, OUTLINE_WIDTH)
};

// The body: the root every segment hangs from. Its transform places its
// `joint` (the rig's body pivot); it collides as one ball, the same blob JOUST
// puts in its lane (`CHARACTER_BODY`), whose centre sits just off the joint.
export const CHARACTER_RAGDOLL_BODY = {
  joint: CHARACTER_PIVOTS.body,
  centre: { x: CHARACTER_BODY.cx, y: CHARACTER_BODY.cy },
  radius: CHARACTER_BODY.r
} as const;

// The four limbs a player grabs with, each the tip of one segment. Left and
// right are the box's, with the hen facing right: the left foot is the near
// leg (the back one, under the tail end), the right foot the far leg.
export const CHARACTER_RAGDOLL_LIMBS = ["footLeft", "footRight", "wing", "beak"] as const;
export type CharacterRagdollLimb = (typeof CHARACTER_RAGDOLL_LIMBS)[number];

export const CHARACTER_RAGDOLL_LIMB_PARTS: Record<CharacterRagdollLimb, CharacterRagdollSegmentPart> = {
  footLeft: "legNear",
  footRight: "legFar",
  wing: "wingNear",
  beak: "head"
};

export type CharacterRagdollTransform = {
  /** The part's joint, in bird-box units, y down. */
  x: number;
  y: number;
  /** Degrees, clockwise on screen; 0 is the part as `still` draws it. */
  rotation: number;
};

export type CharacterRagdollTransforms = Record<CharacterRagdollPart, CharacterRagdollTransform>;

const rest = ({ x, y }: CharacterPivot): CharacterRagdollTransform => ({ x, y, rotation: 0 });

/**
 * The bird standing exactly as `still` draws it: every joint where the rig puts
 * it and nothing turned. A sim starts a bird from here, and the figure drawn
 * from it is the stock hen. Fresh objects every call, so a sim may keep them.
 */
export const resolveCharacterRagdollRest = (): CharacterRagdollTransforms => ({
  wingFar: rest(CHARACTER_RAGDOLL_SEGMENTS.wingFar.joint),
  legFar: rest(CHARACTER_RAGDOLL_SEGMENTS.legFar.joint),
  body: rest(CHARACTER_RAGDOLL_BODY.joint),
  legNear: rest(CHARACTER_RAGDOLL_SEGMENTS.legNear.joint),
  wingNear: rest(CHARACTER_RAGDOLL_SEGMENTS.wingNear.joint),
  head: rest(CHARACTER_RAGDOLL_SEGMENTS.head.joint)
});
