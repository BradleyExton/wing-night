import { JOUST_WORLD } from "@wingnight/shared";

import { joustPalette } from "../palette.js";

export type BackdropProps = {
  // Prefix for gradient ids, so two scenes on one page do not collide.
  sceneId: string;
};

/**
 * How far past the world the backdrop is painted, in world units. The lane is letterboxed into
 * whatever frame it is given, and a frame that is not exactly 16:9 would otherwise show a seam
 * where the drawn sky ends and the frame's own background begins.
 */
export const BACKDROP_BLEED = 400;

const STAR_COUNT = 44;

type Star = { x: number; y: number; r: number; opacity: number };

// A fixed constellation, not a fresh one per render: the tablet and the TV draw the same sky,
// and nothing twinkles (DESIGN.md §8). A small LCG is all "scattered" needs, and it keeps the
// stars up in the dark half of the sky, clear of the horizon glow.
const resolveStars = (): Star[] => {
  let seed = 20260918;
  const next = (): number => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  return Array.from({ length: STAR_COUNT }, (): Star => ({
    x: Math.round((-60 + next() * 280) * 10) / 10,
    y: Math.round((-30 + next() * 64) * 10) / 10,
    r: Math.round((0.22 + next() * 0.38) * 100) / 100,
    opacity: Math.round((0.3 + next() * 0.6) * 100) / 100
  }));
};

const STARS = resolveStars();

const { width, height, floorY } = JOUST_WORLD;
const LEFT = -BACKDROP_BLEED;
const RIGHT = width + BACKDROP_BLEED;

// Two ranges on the horizon behind the dunes, as plateaus: the far one dark, the near one warmer.
// They stop short of the dunes' crests so nothing in the sky competes with a bird on a shelf.
const FAR_MESAS = `M${LEFT} 70 H-30 L-22 63 H-4 L4 70 H40 L48 64 H78 L86 70 H120 L126 66 H150 L158 70 H${RIGHT} V${height} H${LEFT} Z`;
const NEAR_MESAS = `M${LEFT} 73 H10 L18 68 H34 L40 73 H96 L102 69.5 H128 L136 73 H${RIGHT} V${height} H${LEFT} Z`;

const DUNES_FAR = [
  { cx: -60, rx: 70, ry: 7 },
  { cx: 34, rx: 46, ry: 8 },
  { cx: 220, rx: 70, ry: 7 }
];
const DUNES_NEAR = [
  { cx: -30, rx: 56, ry: 9 },
  { cx: 116, rx: 58, ry: 10 },
  { cx: 260, rx: 64, ry: 9 }
];

// Wind lines in the sand: broken, faint, and below the floor line where nothing ever stands.
const RIPPLES = [
  { y: 82.4, offset: 0 },
  { y: 85.2, offset: 7 },
  { y: 88, offset: 3 }
];

const SUN = { cx: width - 26, cy: 22, r: 7, glowRadius: 21 };

/**
 * Everything behind the lane that nothing can hit: sky, stars, sun, the ranges, the dunes, the
 * sand. Painted well past the world on every side (see `BACKDROP_BLEED`), outside the clip the
 * moving bodies live in, so the scene meets whatever frame it is in with sky and sand and never
 * a hard edge.
 */
export const Backdrop = ({ sceneId }: BackdropProps): JSX.Element => {
  const skyGradientId = `${sceneId}-sky`;
  const sandGradientId = `${sceneId}-sand`;
  const sunGlowId = `${sceneId}-sun`;

  return (
    <g data-joust-backdrop>
      <defs>
        {/* userSpaceOnUse pins the bands to the world's own rows, so the bleed above the sky is
            simply more night and the bleed below the sand more sand, not a stretched gradient. */}
        <linearGradient
          id={skyGradientId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={0}
          y2={floorY}
        >
          <stop offset="0%" stopColor={joustPalette.skyTop} />
          <stop offset="62%" stopColor={joustPalette.skyMid} />
          <stop offset="100%" stopColor={joustPalette.horizon} />
        </linearGradient>
        <linearGradient
          id={sandGradientId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={floorY}
          x2={0}
          y2={height}
        >
          <stop offset="0%" stopColor={joustPalette.sand} />
          <stop offset="100%" stopColor={joustPalette.sandDark} />
        </linearGradient>
        <radialGradient id={sunGlowId}>
          <stop offset="0%" stopColor={joustPalette.sun} stopOpacity={0.55} />
          <stop offset="55%" stopColor={joustPalette.sun} stopOpacity={0.16} />
          <stop offset="100%" stopColor={joustPalette.sun} stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect
        x={LEFT}
        y={-BACKDROP_BLEED}
        width={RIGHT - LEFT}
        height={floorY + BACKDROP_BLEED}
        fill={`url(#${skyGradientId})`}
      />
      {STARS.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill={joustPalette.star}
          opacity={star.opacity}
        />
      ))}
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.glowRadius} fill={`url(#${sunGlowId})`} />
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill={joustPalette.sun} opacity={0.95} />

      <path d={FAR_MESAS} fill={joustPalette.mesaFar} />
      <path d={NEAR_MESAS} fill={joustPalette.mesaNear} />
      {DUNES_FAR.map((dune, index) => (
        <ellipse
          key={index}
          cx={dune.cx}
          cy={floorY}
          rx={dune.rx}
          ry={dune.ry}
          fill={joustPalette.duneFar}
        />
      ))}
      {DUNES_NEAR.map((dune, index) => (
        <ellipse
          key={index}
          cx={dune.cx}
          cy={floorY + 1}
          rx={dune.rx}
          ry={dune.ry}
          fill={joustPalette.duneNear}
        />
      ))}

      <rect
        x={LEFT}
        y={floorY}
        width={RIGHT - LEFT}
        height={height - floorY + BACKDROP_BLEED}
        fill={`url(#${sandGradientId})`}
      />
      {RIPPLES.map((ripple, index) => (
        <line
          key={index}
          x1={LEFT}
          y1={ripple.y}
          x2={RIGHT}
          y2={ripple.y}
          stroke={joustPalette.sandDark}
          strokeWidth={0.5}
          strokeDasharray="5 11"
          strokeDashoffset={ripple.offset}
          opacity={0.5}
        />
      ))}
      <line
        x1={LEFT}
        y1={floorY}
        x2={RIGHT}
        y2={floorY}
        stroke={joustPalette.sandLine}
        strokeWidth={0.8}
      />
    </g>
  );
};
