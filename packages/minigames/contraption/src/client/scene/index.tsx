// Placeholder art for the Sidestage scene, in stage pixels. Flat shapes chosen
// to read at TV distance; the CONVENTION (a seated thrower, back turned, well
// above the field) is what shipped from the direction lab, not the drawing.
const PALETTE = {
  skin: "#e8b58b",
  shirt: "#3b82f6",
  cleanerShirt: "#ec4899",
  hair: "#3f2a1d",
  cleanerHair: "#7c2d12",
  bone: "#f5ead6",
  boneShadow: "#d9c7a6",
  wood: "#5a3318",
  woodEdge: "#6a3d1a",
  plate: "#f3eee2",
  sauce: "#ef4444",
  chair: "#1e293b",
  balcony: "#334155",
  balconyEdge: "#475569"
} as const;

export type BalconyProps = {
  // Left edge of the slab; the slab runs to x=0 (the origin is its right end).
  reach: number;
  // Height of the post from the underside of the slab down to the floor.
  drop: number;
};

// The mezzanine the thrower eats on: a slab ending at the field's left wall,
// held up by a post that stands on the same floor the field does. Origin is
// the slab's top-right corner — the wall line — so the front face of the
// balcony IS the wall the physics already has there.
export const Balcony = ({ reach, drop }: BalconyProps): JSX.Element => {
  return (
    <g>
      <rect x={-reach} y={0} width={reach} height={14} rx={3} fill={PALETTE.balcony} />
      <rect x={-reach} y={0} width={reach} height={4} fill={PALETTE.balconyEdge} />
      <rect x={-10} y={14} width={10} height={drop} fill={PALETTE.balcony} />
    </g>
  );
};

export type DrumetteProps = {
  radius: number;
};

// Round enough that a sprite with no angular state never reads as pinned —
// the reason the drumette beat the flat wing bone at the pick.
export const Drumette = ({ radius }: DrumetteProps): JSX.Element => {
  return (
    <g>
      <circle cx={0} cy={0} r={radius} fill={PALETTE.bone} />
      <circle cx={-radius * 0.28} cy={-radius * 0.28} r={radius * 0.6} fill="#fffaf0" opacity={0.6} />
      <rect
        x={radius * 0.7}
        y={-radius * 0.28}
        width={radius * 0.8}
        height={radius * 0.56}
        rx={radius * 0.28}
        fill={PALETTE.boneShadow}
      />
    </g>
  );
};

export type TableProps = {
  width: number;
  // From the underside of the top to whatever the table stands on.
  legHeight: number;
};

// Origin is the top-left corner of the tabletop.
export const Table = ({ width, legHeight }: TableProps): JSX.Element => {
  return (
    <g>
      <rect x={0} y={0} width={width} height={12} rx={4} fill={PALETTE.woodEdge} />
      <rect x={0} y={4} width={width} height={8} fill={PALETTE.wood} />
      <rect x={10} y={12} width={10} height={legHeight} fill={PALETTE.wood} />
      <rect x={width - 20} y={12} width={10} height={legHeight} fill={PALETTE.wood} />
      <ellipse cx={width * 0.42} cy={2} rx={26} ry={6} fill={PALETTE.plate} />
      <ellipse cx={width * 0.42} cy={1} rx={14} ry={3} fill={PALETTE.sauce} opacity={0.8} />
      <rect x={width * 0.72} y={-16} width={14} height={16} rx={3} fill={PALETTE.sauce} />
    </g>
  );
};

export type SeatedThrowerProps = {
  // Wing still in hand, arm cocked over the shoulder; drops once it is thrown.
  holding: boolean;
};

// Origin is the throwing shoulder — the exact point the physics wing starts
// from, so the release reads as a hand-off rather than a teleport. Seen from
// BEHIND: the thrower faces away from the field, back of the head to us.
export const SeatedThrower = ({ holding }: SeatedThrowerProps): JSX.Element => {
  return (
    <g>
      <rect x={-30} y={-6} width={16} height={92} rx={5} fill={PALETTE.chair} />
      <rect x={-22} y={0} width={34} height={54} rx={11} fill={PALETTE.shirt} />
      <circle cx={-5} cy={-16} r={17} fill={PALETTE.skin} />
      <path d="M -22 -16 A 17 17 0 0 1 12 -16 L 12 -6 A 17 17 0 0 1 -22 -6 Z" fill={PALETTE.hair} />
      <g transform={holding ? "rotate(-120, 6, 6)" : "rotate(30, 6, 6)"}>
        <rect x={2} y={4} width={9} height={30} rx={4.5} fill={PALETTE.skin} />
      </g>
      <rect x={-18} y={54} width={12} height={30} rx={4} fill={PALETTE.chair} />
    </g>
  );
};

export type CleanerProps = {
  stooping: boolean;
  carrying: boolean;
};

export const Cleaner = ({ stooping, carrying }: CleanerProps): JSX.Element => {
  return (
    <g>
      <rect x={-13} y={16} width={26} height={42} rx={9} fill={PALETTE.cleanerShirt} />
      <g transform="translate(0, -6)">
        <circle cx={0} cy={0} r={15} fill={PALETTE.skin} />
        <path d="M -15 -2 A 15 15 0 0 1 15 -2 L 15 -12 A 15 15 0 0 0 -15 -12 Z" fill={PALETTE.cleanerHair} />
        <circle cx={-5} cy={0} r={2} fill="#1f2937" />
        <circle cx={5} cy={0} r={2} fill="#1f2937" />
      </g>
      <g transform={stooping ? "rotate(75, -10, 24)" : "rotate(15, -10, 24)"}>
        <rect x={-19} y={18} width={9} height={26} rx={4.5} fill={PALETTE.skin} />
        {carrying ? <circle cx={-14.5} cy={46} r={6} fill={PALETTE.bone} /> : null}
      </g>
    </g>
  );
};
