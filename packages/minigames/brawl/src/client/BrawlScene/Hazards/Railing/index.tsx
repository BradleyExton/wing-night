import { BRAWL_WORLD } from "@wingnight/shared";

import { resolveStops } from "../../Backdrop/layout/index.js";
import type { BrawlNightPalette } from "../nightPalette/index.js";

/** A post every four units, a baluster every one and a third between them, and the rail's height. */
const POST_STEP = 4;
const BALUSTERS_PER_BAY = 3;
const RAIL_HEIGHT = 9;
const MID_RAIL_Y = 5.4;

/**
 * Dunlop Street's hazard: the Queen's patio railing, a run of iron posts under a top rail with a
 * mid rail and balusters, stood on the near sidewalk from `x` across `width` world units. A goon
 * shoved past it goes over it, which is the wirer's beat; this is the thing to go over. Painted
 * in the scene's night steel so it sits with the lamps.
 */
export const Railing = ({ x, width, palette }: { x: number; width: number; palette: BrawlNightPalette }): JSX.Element => {
  const left = Number.isFinite(x) ? x : 0;
  const span = Number.isFinite(width) && width > 0 ? width : POST_STEP;
  const groundY = BRAWL_WORLD.groundY;
  const posts = resolveStops({ left, right: left + span }, POST_STEP, left % POST_STEP);
  const balusterStep = POST_STEP / BALUSTERS_PER_BAY;
  const balusters = resolveStops({ left: left + balusterStep / 2, right: left + span }, balusterStep, (left + balusterStep / 2) % balusterStep).filter(
    (bx) => !posts.some((px) => Math.abs(px - bx) < 0.5)
  );

  return (
    <g data-brawl-hazard="railing" aria-hidden="true">
      <rect x={left - 1} y={groundY} width={span + 2} height={1} fill={palette.shadow} />
      <rect x={left - 0.6} y={groundY - 0.7} width={span + 1.2} height={0.7} fill={palette.steelDark} />
      {balusters.map((bx) => (
        <rect key={bx} x={bx - 0.12} y={groundY - MID_RAIL_Y} width={0.24} height={MID_RAIL_Y - 0.7} fill={palette.steelDark} />
      ))}
      <rect x={left} y={groundY - MID_RAIL_Y} width={span} height={0.5} fill={palette.steel} />
      {posts.map((px) => (
        <g key={px}>
          <rect x={px - 0.35} y={groundY - RAIL_HEIGHT} width={0.7} height={RAIL_HEIGHT} fill={palette.steelDark} />
          <circle cx={px} cy={groundY - RAIL_HEIGHT - 0.5} r={0.55} fill={palette.steel} />
        </g>
      ))}
      <rect x={left - 0.4} y={groundY - RAIL_HEIGHT - 0.2} width={span + 0.8} height={0.9} fill={palette.steel} />
      <rect x={left - 0.4} y={groundY - RAIL_HEIGHT - 0.2} width={span + 0.8} height={0.25} fill={palette.glint} />
    </g>
  );
};
