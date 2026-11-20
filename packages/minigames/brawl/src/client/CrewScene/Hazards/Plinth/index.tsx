import { STREET_BANDS } from "../../Backdrop/layout/index.js";
import type { BrawlNightPalette } from "../nightPalette/index.js";

/** How far the slab rises off the sand, and the lit lip along its edges. */
const RISE = 4;
const LIP = 0.45;
const SLAB = 9;

/**
 * Centennial Beach's hazard: the concrete walk out to the Spirit Catcher's plinth, a slab raised
 * off the sand from `x` across `width` world units and laid across the WHOLE depth of the band —
 * a shove into it is decided left to right only. Its top face is the lighter concrete, jointed
 * into slabs back to front, with a lit lip down both edges; its front face, below the band, is
 * the Spirit Catcher's own mound dark, so it reads as a block with a top and not a painted patch.
 * A goon flung onto it trips over the step.
 */
export const Plinth = ({ x, width, palette }: { x: number; width: number; palette: BrawlNightPalette }): JSX.Element => {
  const left = Number.isFinite(x) ? x : 0;
  const span = Number.isFinite(width) && width > 0 ? width : 12;
  const { bandBackY, bandFrontY, bottom } = STREET_BANDS;
  const back = bandBackY - 5;
  const front = bandFrontY + 2;
  const joints = Array.from({ length: Math.floor((front - back) / SLAB) }, (_unused, index) => back + (index + 1) * SLAB).filter((y) => y < front - 2);

  return (
    <g data-brawl-hazard="plinth" aria-hidden="true">
      <rect x={left - 1.2} y={back + 1} width={span + 2.4} height={front - back + RISE} fill={palette.shadow} />
      <rect x={left} y={front} width={span} height={Math.min(RISE, bottom - front)} fill={palette.mound} />
      <rect x={left} y={back} width={span} height={front - back} fill={palette.kerb} />
      {joints.map((y) => (
        <rect key={y} x={left} y={y} width={span} height={0.35} fill={palette.mound} opacity={0.7} />
      ))}
      <rect x={left} y={back} width={LIP} height={front - back} fill={palette.glint} />
      <rect x={left + span - LIP} y={back} width={LIP} height={front - back} fill={palette.glint} />
      <rect x={left} y={front - LIP} width={span} height={LIP} fill={palette.glint} />
      <rect x={left} y={back} width={span} height={1.2} fill={palette.mound} opacity={0.6} />
    </g>
  );
};
