import { BRAWL_WORLD } from "@wingnight/shared";

import type { BrawlNightPalette } from "../nightPalette/index.js";

/** How far the step rises off the sand, how deep its top face reads, and its lip. */
const RISE = 5;
const TOP = 1.4;
const LIP = 0.4;

/**
 * Centennial Beach's hazard: the concrete plinth the Spirit Catcher stands on, a step up off the
 * sand from `x` across `width` world units. A goon flung over it is the wirer's beat; this is the
 * step. The front face is the Spirit Catcher's own mound dark (the sand is the sidewalk's tone,
 * and a face in it vanished), two joints down it and one across in the lighter concrete, the top
 * face lighter still with a lit lip along its edge, so it reads as a block with a top and not a
 * wall.
 */
export const Plinth = ({ x, width, palette }: { x: number; width: number; palette: BrawlNightPalette }): JSX.Element => {
  const left = Number.isFinite(x) ? x : 0;
  const span = Number.isFinite(width) && width > 0 ? width : 12;
  const groundY = BRAWL_WORLD.groundY;
  const joints = [left + span / 3, left + (2 * span) / 3];

  return (
    <g data-brawl-hazard="plinth" aria-hidden="true">
      <rect x={left - 0.8} y={groundY - 0.3} width={span + 1.6} height={1.3} fill={palette.shadow} />
      <rect x={left} y={groundY - RISE} width={span} height={RISE} fill={palette.mound} />
      <rect x={left} y={groundY - RISE / 2 - 0.2} width={span} height={0.35} fill={palette.sidewalk} opacity={0.6} />
      {joints.map((jx) => (
        <rect key={jx} x={jx - 0.2} y={groundY - RISE} width={0.4} height={RISE} fill={palette.sidewalk} opacity={0.6} />
      ))}
      <rect x={left - 0.4} y={groundY - RISE - TOP} width={span + 0.8} height={TOP} fill={palette.kerb} />
      <rect x={left - 0.4} y={groundY - RISE - TOP} width={span + 0.8} height={LIP} fill={palette.glint} />
    </g>
  );
};
