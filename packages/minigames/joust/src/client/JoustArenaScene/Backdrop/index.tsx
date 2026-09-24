import { SpiritCatcher, TownCluster } from "@wingnight/scenery";
import type { SceneryPalette } from "@wingnight/scenery";
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

/**
 * The rows of the view from Centennial Beach, looking out over the bay: where Oro's bank meets
 * the water, where the water meets the beach, and the floor line the rack stands on. The water
 * sits behind the sand row's heads and the far shore behind the shelves, so a bird on either
 * reads against something flat.
 */
const HORIZON_Y = 58;
const SHORE_Y = 75;

/**
 * The sun is going down over the head of the bay, half into the far treeline, and the water
 * carries its column. Kept low on purpose: the sky above the horizon is where the shelves are,
 * and nothing up there may compete with a bird on one.
 */
const SUN = { cx: 136, cy: 54, r: 6.5, glowRadius: 18 };

/**
 * The landmarks in dusk silhouette: one colour, the light behind them. `@wingnight/scenery`
 * draws the same shapes SCHLONIC stands in its morning haze; only the windows are lit here.
 */
const SCENERY: SceneryPalette = {
  steel: joustPalette.silhouette,
  steelDark: joustPalette.silhouette,
  mound: joustPalette.beachWet,
  wall: joustPalette.silhouette,
  wallDark: joustPalette.silhouette,
  glass: joustPalette.glass,
  brick: joustPalette.silhouette,
  brickDark: joustPalette.silhouette,
  roof: joustPalette.silhouette,
  platform: joustPalette.silhouette,
  dock: joustPalette.silhouette,
  dockDark: joustPalette.silhouette,
  hull: joustPalette.silhouette,
  mast: joustPalette.silhouette,
  sail: joustPalette.silhouette
};

/** Downtown, on the far horizon at the west end, half off the frame the way a skyline is. */
const TOWN_X = -6;
/** The Spirit Catcher, on the beach behind the rack: a giant steel bird overlooking a rack of hens. */
const SPIRIT_CATCHER = { x: 108, halfSpan: 16 };

/** The far bank: a low, continuous run of humps filled down past the waterline. */
const ridgeBand = (humpWidth: number, humpHeight: number): string => {
  const shares = [0.7, 1, 0.5, 0.85, 0.6];
  const path = [`M${LEFT} ${HORIZON_Y}`];

  for (let left = LEFT; left < RIGHT; left += humpWidth) {
    const rise = humpHeight * (shares[Math.round((left - LEFT) / humpWidth) % shares.length] ?? 1);

    path.push(`Q${left + humpWidth / 2} ${HORIZON_Y - rise} ${left + humpWidth} ${HORIZON_Y}`);
  }

  return `${path.join(" ")} L${RIGHT} ${HORIZON_Y + 4} L${LEFT} ${HORIZON_Y + 4} Z`;
};

/** The conifers on it, as one sawtooth run: at this distance a treeline is a texture, not trees. */
const treeBand = (): string => {
  const step = 2.6;
  const heights = [2.4, 1.6, 3, 1.9, 2.7, 1.4];
  const path = [`M${LEFT} ${HORIZON_Y}`];

  for (let tree = 0; LEFT + tree * step < RIGHT; tree += 1) {
    const left = LEFT + tree * step;
    const rise = heights[tree % heights.length] ?? 2;

    path.push(`L${left + step / 2} ${HORIZON_Y - rise} L${left + step} ${HORIZON_Y}`);
  }

  return `${path.join(" ")} L${RIGHT} ${HORIZON_Y + 3} L${LEFT} ${HORIZON_Y + 3} Z`;
};

/** Porch lights coming on along the far shore, clear of the sun's glow. */
const SHORE_LIGHTS = [-34, -12, 8, 27, 49, 66, 84, 103, 118, 175, 196, 231];

// Wind lines in the sand: broken, faint, and below the floor line where nothing ever stands.
const RIPPLES = [
  { y: 82.4, offset: 0 },
  { y: 85.2, offset: 7 },
  { y: 88, offset: 3 }
];

/**
 * Everything behind the lane that nothing can hit: sky, stars, the sun going down, the far shore,
 * downtown, the bay with the sun's column on it, the Spirit Catcher on the beach, the sand.
 * Painted well past the world on every side (see `BACKDROP_BLEED`), outside the clip the moving
 * bodies live in, so the scene meets whatever frame it is in with sky and sand and never a hard
 * edge.
 */
export const Backdrop = ({ sceneId }: BackdropProps): JSX.Element => {
  const skyGradientId = `${sceneId}-sky`;
  const bayGradientId = `${sceneId}-bay`;
  const sandGradientId = `${sceneId}-sand`;
  const sunGlowId = `${sceneId}-sun`;

  return (
    <g data-joust-backdrop>
      <defs>
        {/* userSpaceOnUse pins the bands to the world's own rows, so the bleed above the sky is
            simply more night and the bleed below the sand more sand, not a stretched gradient. */}
        <linearGradient id={skyGradientId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={HORIZON_Y}>
          <stop offset="0%" stopColor={joustPalette.skyTop} />
          <stop offset="55%" stopColor={joustPalette.skyMid} />
          <stop offset="100%" stopColor={joustPalette.horizon} />
        </linearGradient>
        <linearGradient id={bayGradientId} gradientUnits="userSpaceOnUse" x1={0} y1={HORIZON_Y} x2={0} y2={SHORE_Y}>
          <stop offset="0%" stopColor={joustPalette.bayFar} />
          <stop offset="45%" stopColor={joustPalette.bay} />
          <stop offset="100%" stopColor={joustPalette.bayNear} />
        </linearGradient>
        <linearGradient id={sandGradientId} gradientUnits="userSpaceOnUse" x1={0} y1={floorY} x2={0} y2={height}>
          <stop offset="0%" stopColor={joustPalette.sand} />
          <stop offset="100%" stopColor={joustPalette.sandDark} />
        </linearGradient>
        <radialGradient id={sunGlowId}>
          <stop offset="0%" stopColor={joustPalette.sun} stopOpacity={0.6} />
          <stop offset="55%" stopColor={joustPalette.sun} stopOpacity={0.18} />
          <stop offset="100%" stopColor={joustPalette.sun} stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect x={LEFT} y={-BACKDROP_BLEED} width={RIGHT - LEFT} height={HORIZON_Y + BACKDROP_BLEED} fill={`url(#${skyGradientId})`} />
      {STARS.map((star, index) => (
        <circle key={index} cx={star.x} cy={star.y} r={star.r} fill={joustPalette.star} opacity={star.opacity} />
      ))}
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.glowRadius} fill={`url(#${sunGlowId})`} />
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill={joustPalette.sun} opacity={0.95} />

      {/* Oro's shore across the water, and downtown at the head of the bay, all one haze. */}
      <path d={ridgeBand(64, 7)} fill={joustPalette.shoreFar} />
      <TownCluster x={TOWN_X} baseY={HORIZON_Y + 0.5} palette={SCENERY} />
      <path d={treeBand()} fill={joustPalette.shoreFarTrees} />
      {SHORE_LIGHTS.map((x) => (
        <circle key={x} cx={x} cy={HORIZON_Y - 0.5} r={0.36} fill={joustPalette.shoreLight} opacity={0.85} />
      ))}

      {/* The bay, carrying the sky, with the sun's column broken across it. */}
      <rect x={LEFT} y={HORIZON_Y} width={RIGHT - LEFT} height={SHORE_Y - HORIZON_Y} fill={`url(#${bayGradientId})`} />
      <g fill={joustPalette.bayGlitter}>
        {Array.from({ length: 8 }, (_unused, row) => {
          const y = HORIZON_Y + 1.6 + row * 1.9;
          const spread = 1.6 + row * 1.7;
          // Broken into dashes: a solid bar per row reads as a ladder, not as light on water.
          const dashes = [-0.72, -0.24, 0.3, 0.78];

          return dashes.map((share, dash) => (
            <rect
              key={`${row}-${dash}`}
              x={SUN.cx + spread * share}
              y={y}
              width={1.4 + (dash % 2) * 1.3}
              height={0.55}
              opacity={0.5 - row * 0.045}
            />
          ));
        })}
      </g>
      <line x1={LEFT} y1={SHORE_Y} x2={RIGHT} y2={SHORE_Y} stroke={joustPalette.foam} strokeWidth={0.6} opacity={0.45} />

      {/* The beach: wet where the water just was, and the Spirit Catcher stood on it behind the rack. */}
      <rect x={LEFT} y={SHORE_Y} width={RIGHT - LEFT} height={floorY - SHORE_Y} fill={joustPalette.beachWet} />
      {/* A shade under solid: it is the nearest thing in the backdrop and still has to sit behind. */}
      <g opacity={0.9}>
        <SpiritCatcher
          x={SPIRIT_CATCHER.x}
          baseY={floorY - 0.5}
          halfSpan={SPIRIT_CATCHER.halfSpan}
          palette={SCENERY}
        />
      </g>

      <rect x={LEFT} y={floorY} width={RIGHT - LEFT} height={height - floorY + BACKDROP_BLEED} fill={`url(#${sandGradientId})`} />
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
      <line x1={LEFT} y1={floorY} x2={RIGHT} y2={floorY} stroke={joustPalette.sandLine} strokeWidth={0.8} />
    </g>
  );
};
