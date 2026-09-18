// Where the head is on the bird, for everything that has to land on it: the
// comb, the beak, the wattle and the team's apparel. Two sets, because a
// drawn head is a 12-unit circle up on the neck while a costume head (a
// player's generated likeness) is a 44-unit image whose chin sits in the
// same place and whose hair rises past the top of the box.
export type HeadAnchors = {
  cx: number;
  top: number;
  eyeY: number;
  chin: number;
  beakX: number;
  beakY: number;
};

export const DRAWN_HEAD = { cx: 58, cy: 20, r: 12 } as const;

export const DRAWN_HEAD_ANCHORS: HeadAnchors = {
  cx: DRAWN_HEAD.cx,
  top: DRAWN_HEAD.cy - DRAWN_HEAD.r,
  eyeY: DRAWN_HEAD.cy - 2,
  chin: DRAWN_HEAD.cy + DRAWN_HEAD.r,
  beakX: DRAWN_HEAD.cx + DRAWN_HEAD.r - 1,
  beakY: DRAWN_HEAD.cy
};

// At party distance the face is the identity, so the costume head is a
// bobblehead: 44 tall against a 72-tall bird. The mouth of a head-only
// portrait sits about 60% down it, which is where the beak pokes out.
export const COSTUME_HEAD_HEIGHT = 44;

export const COSTUME_HEAD_ANCHORS: HeadAnchors = {
  cx: DRAWN_HEAD.cx,
  top: DRAWN_HEAD_ANCHORS.chin - COSTUME_HEAD_HEIGHT,
  eyeY: DRAWN_HEAD_ANCHORS.chin - COSTUME_HEAD_HEIGHT + Math.round(COSTUME_HEAD_HEIGHT * 0.42),
  chin: DRAWN_HEAD_ANCHORS.chin,
  beakX: DRAWN_HEAD.cx + 16,
  beakY: DRAWN_HEAD_ANCHORS.chin - COSTUME_HEAD_HEIGHT + Math.round(COSTUME_HEAD_HEIGHT * 0.6)
};

// The comb and hat paths are drawn with their base on y=13 centred on x=56;
// this moves one to sit with its base on `baseY`, centred on `cx`.
export const perchTransform = (cx: number, baseY: number): string =>
  `translate(${cx - 56} ${baseY - 13})`;
