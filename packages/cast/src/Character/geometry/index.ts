// Where the head is on the bird, for everything that has to land on it: the
// comb and the team's apparel. Two sets, because a drawn head is a 12-unit
// circle up on the neck while a costume head (a player's generated likeness)
// is a 44-unit image whose chin sits in the same place and whose hair rises
// past the top of the box.
export type HeadAnchors = {
  cx: number;
  top: number;
  eyeY: number;
  chin: number;
  // Where a prop that hangs BELOW the head hangs from. The chin on a drawn
  // head; a little lower on a costume head, because that chin is the bottom
  // edge of a photograph and a collar's spikes rising to meet it would bite
  // into the player's jaw.
  shoulders: number;
};

export const DRAWN_HEAD = { cx: 58, cy: 20, r: 12 } as const;

// The root of the beak, on the drawn head's cheek. A costume head has none:
// the player's face is the face, and the bird's own would only poke out from
// behind it.
export const DRAWN_BEAK = {
  x: DRAWN_HEAD.cx + DRAWN_HEAD.r - 1,
  y: DRAWN_HEAD.cy
} as const;

export const DRAWN_HEAD_ANCHORS: HeadAnchors = {
  cx: DRAWN_HEAD.cx,
  top: DRAWN_HEAD.cy - DRAWN_HEAD.r,
  eyeY: DRAWN_HEAD.cy - 2,
  chin: DRAWN_HEAD.cy + DRAWN_HEAD.r,
  shoulders: DRAWN_HEAD.cy + DRAWN_HEAD.r
};

// At party distance the face is the identity, so the costume head is a
// bobblehead: 44 tall against a 72-tall bird.
export const COSTUME_HEAD_HEIGHT = 44;

// How far below the photo's chin a hanging prop drops, so its topmost point
// clears the jaw rather than crossing a beard.
const COSTUME_SHOULDER_DROP = 5;

export const COSTUME_HEAD_ANCHORS: HeadAnchors = {
  cx: DRAWN_HEAD.cx,
  top: DRAWN_HEAD_ANCHORS.chin - COSTUME_HEAD_HEIGHT,
  eyeY: DRAWN_HEAD_ANCHORS.chin - COSTUME_HEAD_HEIGHT + Math.round(COSTUME_HEAD_HEIGHT * 0.42),
  chin: DRAWN_HEAD_ANCHORS.chin,
  shoulders: DRAWN_HEAD_ANCHORS.chin + COSTUME_SHOULDER_DROP
};

// The comb and hat paths are drawn with their base on y=13 centred on x=56;
// this moves one to sit with its base on `baseY`, centred on `cx`. Only a
// drawn head ever wears either — see `CharacterFigure`.
export const perchTransform = (cx: number, baseY: number): string =>
  `translate(${cx - 56} ${baseY - 13})`;

// The rig. The hen is drawn in six parts, back to front, and each part turns
// about its own pivot — the tail about its root, a leg about its hip, the
// wing about the shoulder, the head (neck and all) about the base of the
// neck — so a pose is a rotation per part and never a redraw. The body has
// no joint; its pivot is only where a bob is measured from.
export const CHARACTER_PARTS = ["tail", "legFar", "body", "legNear", "wing", "head"] as const;
export type CharacterPart = (typeof CHARACTER_PARTS)[number];

export type CharacterPivot = { x: number; y: number };

export const CHARACTER_PIVOTS: Record<CharacterPart, CharacterPivot> = {
  tail: { x: 20, y: 42 },
  legFar: { x: 44, y: 57 },
  body: { x: 40, y: 45 },
  legNear: { x: 32, y: 57 },
  wing: { x: 47, y: 35 },
  head: { x: 52, y: 36 }
};

// What the parts are doing. `still` is the pose for a surface that moves the
// parts itself (FAPPY beats the wing off its physics) or wants a frozen bird;
// `idle` and `walk` are looping CSS beats keyed off `cast-*` keyframes in the
// client's stylesheet; `fly` is a static tuck of the legs, not a loop; and
// `dance` is the player's own move (`CharacterAppearance.dance`), a two-state
// groove that a `data-beat` toggle on a `group/beat` ancestor flips between.
export const CHARACTER_POSES = ["still", "idle", "walk", "fly", "dance"] as const;
export type CharacterPose = (typeof CHARACTER_POSES)[number];

// The bird's own proportions, for surfaces that have to stand it up somewhere
// that is not a page: the sole of its feet, how tall it stands from there to
// the middle of its head, and the radius that head reads as. JOUST scales the
// whole figure off `CHARACTER_STAND_HEIGHT` so the drawn bird and the physics
// pin it is standing on are the same creature.
//
// Measured against the COSTUME head, not the drawn one: on a real night every
// player has a generated likeness, and the bobblehead is the silhouette the
// room actually sees. A player without one gets the smaller drawn head, and
// stands a little shorter for it.
export const CHARACTER_BOX = { width: 80, height: 72 } as const;

/** Between the two legs, on the ground. */
export const CHARACTER_FOOT = { x: 38, y: 71 } as const;

export const CHARACTER_HEAD_CENTRE = {
  x: COSTUME_HEAD_ANCHORS.cx,
  y: COSTUME_HEAD_ANCHORS.top + COSTUME_HEAD_HEIGHT / 2
} as const;

export const CHARACTER_STAND_HEIGHT = CHARACTER_FOOT.y - CHARACTER_HEAD_CENTRE.y;

export const CHARACTER_HEAD_RADIUS = COSTUME_HEAD_HEIGHT / 2;
