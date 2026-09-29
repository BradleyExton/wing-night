import { forwardRef } from "react";
import { FAPPY_WORLD } from "@wingnight/shared";
import { QueensHotel, Storefronts, TownCluster, WaterfrontCondos } from "@wingnight/scenery";

import { fappyPalette } from "../palette.js";
import * as styles from "./styles.js";

// What is behind the corridor: downtown Barrie in the afternoon. The sun and
// Kempenfelt Bay stand still; across the bay the skyline — downtown's slabs,
// City Hall and the twin condos on the water — slides at a fifth of the
// scroll, and Dunlop Street in front of it, the Queen's among its fronts, at
// nearly half, so the world has depth without the sim knowing the city
// exists. Nothing here is a hazard, and all of it is hazed and quiet so a
// champ, an eagle or a glob in front of it still wins the eye.
//
// Each band is a tile drawn twice side by side, and the loop slides it by the
// scroll modulo the tile, so a leg of any length never runs off its end and
// the city is drawn once, not a leg's length of it.
export const FAR_SKYLINE_PARALLAX = 0.2;
export const NEAR_SKYLINE_PARALLAX = 0.45;
const FAR_SKYLINE_TILE = 260;
const NEAR_SKYLINE_TILE = 300;

// Where the far bank meets the water, and where Dunlop Street's fronts stand.
const FAR_SHORE_Y = 67;
const NEAR_STREET_Y = 82;
const STOREFRONT_SCALE = 0.8;

/** How far a band has slid for a scroll, as the CSS transform the loop writes. */
export const resolveSkylineTransform = (scrollX: number, band: "far" | "near"): string => {
  const [parallax, tile] =
    band === "far" ? [FAR_SKYLINE_PARALLAX, FAR_SKYLINE_TILE] : [NEAR_SKYLINE_PARALLAX, NEAR_SKYLINE_TILE];
  const shift = (((scrollX * parallax) % tile) + tile) % tile;

  return `translate3d(calc(${-shift} * var(--fappy-unit)), 0, 0)`;
};

type Slab = { x: number; width: number; height: number };

// The anonymous downtown between the landmarks: plain slabs, a shadow side
// and a band of glass per floor, nothing finer.
const FAR_SLABS: readonly Slab[] = [
  { x: 2, width: 7, height: 17 },
  { x: 10, width: 6, height: 25 },
  { x: 17, width: 9, height: 13 },
  { x: 28, width: 6, height: 21 },
  { x: 35, width: 7, height: 11 },
  { x: 142, width: 8, height: 15 },
  { x: 151, width: 6, height: 23 },
  { x: 158, width: 10, height: 11 },
  { x: 171, width: 7, height: 18 },
  { x: 180, width: 9, height: 27 },
  { x: 190, width: 6, height: 14 },
  { x: 226, width: 9, height: 12 },
  { x: 236, width: 7, height: 20 },
  { x: 244, width: 8, height: 10 }
];

// Dunlop Street's runs of fronts; the gaps between them are the side streets
// the bay shows down.
const NEAR_RUNS: readonly { x: number; count: number; seed: number }[] = [
  { x: 2, count: 4, seed: 3 },
  { x: 44, count: 5, seed: 11 },
  { x: 136, count: 3, seed: 7 },
  { x: 172, count: 4, seed: 19 },
  { x: 210, count: 2, seed: 23 },
  { x: 238, count: 6, seed: 31 }
];
// Where the leg's first look at the street lands, just past the start roof.
const QUEENS_X = 100;
const QUEENS_SCALE = 0.6;

const resolveFloorBands = ({ x, width, height }: Slab): string => {
  const bands: string[] = [];

  for (let y = FAR_SHORE_Y - height + 1.6; y < FAR_SHORE_Y - 1.5; y += 2.6) {
    bands.push(`M ${x + 0.9} ${y} h ${width - 1.6} v 0.9 h ${-(width - 1.6)} Z`);
  }

  return bands.join(" ");
};

const { farSkyline: far, nearSkyline: near } = fappyPalette;

const FarTile = ({ x }: { x: number }): JSX.Element => (
  <g transform={`translate(${x} 0)`}>
    {FAR_SLABS.map((slab) => (
      <g key={slab.x}>
        <rect x={slab.x} y={FAR_SHORE_Y - slab.height} width={slab.width} height={slab.height} fill={far.wall} />
        <rect x={slab.x} y={FAR_SHORE_Y - slab.height} width={1.1} height={slab.height} fill={far.wallDark} />
        <path d={resolveFloorBands(slab)} fill={far.glass} opacity={0.35} />
      </g>
    ))}
    <g transform={`translate(46 ${FAR_SHORE_Y}) scale(1.4)`}>
      <TownCluster x={0} baseY={0} palette={far} />
    </g>
    <WaterfrontCondos x={104} baseY={FAR_SHORE_Y} scale={0.72} palette={far} />
    <rect x={0} y={FAR_SHORE_Y - 0.8} width={FAR_SKYLINE_TILE} height={2} fill={far.shore} />
  </g>
);

const NearTile = ({ x }: { x: number }): JSX.Element => (
  <g transform={`translate(${x} 0)`}>
    {NEAR_RUNS.map((run) => (
      <Storefronts
        key={run.x}
        x={run.x}
        baseY={NEAR_STREET_Y}
        seed={run.seed}
        count={run.count}
        scale={STOREFRONT_SCALE}
        palette={near}
      />
    ))}
    <QueensHotel x={QUEENS_X} baseY={NEAR_STREET_Y} scale={QUEENS_SCALE} palette={near} />
    <rect x={0} y={NEAR_STREET_Y} width={NEAR_SKYLINE_TILE} height={FAPPY_WORLD.floorY - NEAR_STREET_Y} fill={near.promenade} />
    <rect x={0} y={NEAR_STREET_Y} width={NEAR_SKYLINE_TILE} height={0.5} fill={near.promenadeDark} />
  </g>
);

// The sun's glitter on the water below it, where a side street shows it.
const GLITTER = [
  { x: 128, y: 69.4, width: 6 },
  { x: 135, y: 70.8, width: 4 },
  { x: 124, y: 72.6, width: 3.5 },
  { x: 139, y: 73.4, width: 5 },
  { x: 131, y: 75.8, width: 4.5 }
];

export type BackdropRefs = {
  far: SVGSVGElement | null;
  near: SVGSVGElement | null;
};

export const Backdrop = forwardRef<BackdropRefs, { idPrefix: string }>(({ idPrefix }, ref): JSX.Element => {
  const refs: BackdropRefs = { far: null, near: null };
  const ids = { sun: `${idPrefix}-sun`, haze: `${idPrefix}-haze` };
  const { width, height, floorY } = FAPPY_WORLD;
  const assign = (): void => {
    if (typeof ref === "function") {
      ref(refs);
    } else if (ref !== null) {
      ref.current = refs;
    }
  };

  return (
    <div className={styles.backdrop} data-fappy-backdrop aria-hidden="true">
      <svg
        ref={(element): void => {
          refs.far = element;
          assign();
        }}
        className={styles.farBand}
        viewBox={`0 0 ${FAR_SKYLINE_TILE * 2} ${height}`}
        preserveAspectRatio="none"
        data-fappy-skyline="far"
      >
        <FarTile x={0} />
        <FarTile x={FAR_SKYLINE_TILE} />
      </svg>
      <svg className={styles.still} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <radialGradient id={ids.sun} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={fappyPalette.sun} />
            <stop offset="28%" stopColor={fappyPalette.sun} />
            <stop offset="36%" stopColor={fappyPalette.sunGlow} stopOpacity={0.6} />
            <stop offset="100%" stopColor={fappyPalette.sunGlow} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={ids.haze} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fappyPalette.haze} stopOpacity={0} />
            <stop offset="100%" stopColor={fappyPalette.haze} stopOpacity={0.65} />
          </linearGradient>
        </defs>
        <circle cx={134} cy={17} r={18} fill={`url(#${ids.sun})`} data-fappy-sun />
        <rect x={0} y={44} width={width} height={FAR_SHORE_Y + 0.6 - 44} fill={`url(#${ids.haze})`} />
        <g data-fappy-bay>
          <rect x={0} y={FAR_SHORE_Y + 0.6} width={width} height={4} fill={fappyPalette.bayFar} />
          <rect x={0} y={FAR_SHORE_Y + 4.6} width={width} height={floorY - FAR_SHORE_Y - 4.6} fill={fappyPalette.bay} />
          {GLITTER.map((glint) => (
            <rect key={glint.x} x={glint.x} y={glint.y} width={glint.width} height={0.45} rx={0.2} fill={fappyPalette.bayGlitter} opacity={0.8} />
          ))}
        </g>
      </svg>
      <svg
        ref={(element): void => {
          refs.near = element;
          assign();
        }}
        className={styles.nearBand}
        viewBox={`0 0 ${NEAR_SKYLINE_TILE * 2} ${height}`}
        preserveAspectRatio="none"
        data-fappy-skyline="near"
      >
        <NearTile x={0} />
        <NearTile x={NEAR_SKYLINE_TILE} />
      </svg>
    </div>
  );
});

Backdrop.displayName = "Backdrop";
