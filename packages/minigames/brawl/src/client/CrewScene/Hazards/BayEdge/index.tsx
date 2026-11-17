import { STREET_BANDS, resolveGlints } from "../../Backdrop/layout/index.js";
import type { BrawlNightPalette } from "../nightPalette/index.js";

/** The lip's thickness, the pilings' size, and where the ripples sit down the gap. */
const LIP = 0.9;
const PILING_WIDTH = 1.5;
const PILING_HEIGHT = 9;
const RIPPLE_ROWS = [5, 13, 21, 29, 37];

/**
 * The waterfront's hazard: the boardwalk ends and Kempenfelt Bay is right there. From `x` across
 * `width` world units the planks are gone for the WHOLE depth of the band — black water with a
 * pale lip all round, the lamps' glints broken on it, a piling at each corner — because a shove
 * into it is decided left to right only. A goon shoved onto it goes in.
 */
export const BayEdge = ({ x, width, palette }: { x: number; width: number; palette: BrawlNightPalette }): JSX.Element => {
  const left = Number.isFinite(x) ? x : 0;
  const span = Number.isFinite(width) && width > 0 ? width : 12;
  const { boardwalkTop, bottom, bandBackY, bandFrontY } = STREET_BANDS;
  const glints = resolveGlints({ left: left + 1, right: left + span - 1 }, boardwalkTop + 2, bottom - 12).filter(
    (glint) => glint.x + glint.width <= left + span - 1
  );

  return (
    <g data-brawl-hazard="bay" aria-hidden="true">
      <rect x={left} y={boardwalkTop} width={span} height={bottom - boardwalkTop} fill={palette.water} />
      {glints.map((glint) => (
        <rect key={glint.x} x={glint.x} y={glint.y} width={glint.width} height={0.4} fill={palette.glint} />
      ))}
      {RIPPLE_ROWS.map((drop) => (
        <path
          key={drop}
          d={`M ${left + 3} ${boardwalkTop + drop} q ${span / 4 - 1.5} -1 ${span / 2 - 3} 0 q ${span / 4 - 1.5} 1 ${span / 2 - 3} 0`}
          fill="none"
          stroke={palette.glint}
          strokeWidth={0.45}
          strokeLinecap="round"
          opacity={0.7}
        />
      ))}
      <rect x={left - LIP / 2} y={boardwalkTop} width={span + LIP} height={LIP} fill={palette.chalk} />
      <rect x={left - LIP / 2} y={boardwalkTop} width={LIP} height={bottom - boardwalkTop} fill={palette.chalk} opacity={0.85} />
      <rect x={left + span - LIP / 2} y={boardwalkTop} width={LIP} height={bottom - boardwalkTop} fill={palette.chalk} opacity={0.85} />
      {[bandBackY - 1, bandFrontY + 3].map((footY) =>
        [left - PILING_WIDTH - 0.2, left + span + 0.2].map((px) => (
          <g key={`${footY}:${px}`}>
            <rect x={px} y={footY - PILING_HEIGHT} width={PILING_WIDTH} height={PILING_HEIGHT + 1.5} fill={palette.post} />
            <rect x={px - 0.25} y={footY - PILING_HEIGHT - 0.8} width={PILING_WIDTH + 0.5} height={0.9} fill={palette.trim} />
            <rect x={px} y={footY - PILING_HEIGHT} width={0.35} height={PILING_HEIGHT + 1.5} fill={palette.glint} opacity={0.5} />
          </g>
        ))
      )}
    </g>
  );
};
