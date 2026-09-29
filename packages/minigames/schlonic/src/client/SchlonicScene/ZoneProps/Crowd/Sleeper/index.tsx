import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_HAZARDS } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";

const OUTLINE = 0.5;

/**
 * Somebody asleep on the pavers in a grey hoodie, curled up on their side with their back to the
 * street: the hood up over the head at one end, bare feet out of the sweatpants at the other,
 * and a sandal held in the one hand that is out. Long and low — it is jumped late, and it is
 * the one thing on the sidewalk that gets no joke told about it: it is drawn as it is.
 */
export const Sleeper = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { width, height } = SCHLONIC_HAZARDS.sleeper;
  const left = prop.x - width / 2;
  const right = left + width;
  const top = prop.y - height;
  // Feet at the near end, hood at the far end, the body a low lump between.
  const feetX = left + 2.2;
  const hoodX = right - 2.6;
  const body = `M ${feetX} ${prop.y} Q ${feetX + 1} ${top + 0.6} ${feetX + 4} ${top + 0.4} L ${hoodX - 2} ${top} Q ${hoodX + 2.4} ${top - 0.4} ${hoodX + 2.4} ${prop.y} Z`;

  return (
    <g>
      <GroundShadow x={prop.x} y={prop.y} radius={width * 0.5} />
      {/* Feet, out past the cuffs. */}
      <ellipse cx={left + 1.4} cy={prop.y - 1} rx={1.6} ry={0.75} fill={schlonicPalette.skin} stroke={schlonicPalette.skinDark} strokeWidth={OUTLINE * 0.7} />
      <ellipse cx={left + 1.9} cy={prop.y - 1.9} rx={1.5} ry={0.65} fill={schlonicPalette.skin} stroke={schlonicPalette.skinDark} strokeWidth={OUTLINE * 0.7} />
      <path d={body} fill={schlonicPalette.hoodie} stroke={schlonicPalette.hoodieDark} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {/* The waistband and the grime down the side that is on the ground. */}
      <path d={`M ${feetX + 6.5} ${top + 0.7} L ${feetX + 6.2} ${prop.y - 0.3}`} stroke={schlonicPalette.hoodieDark} strokeWidth={0.4} />
      <path d={`M ${feetX + 1} ${prop.y - 0.6} L ${hoodX + 1.6} ${prop.y - 0.6}`} stroke={schlonicPalette.hoodieDark} strokeWidth={0.5} opacity={0.5} />
      {/* The hood, and the bit of face inside it. */}
      <path d={`M ${hoodX - 1.6} ${prop.y} Q ${hoodX - 1.8} ${top - 0.6} ${hoodX + 1.2} ${top - 0.4} Q ${hoodX + 3.2} ${top - 0.2} ${hoodX + 2.6} ${prop.y} Z`} fill={schlonicPalette.hoodieLight} stroke={schlonicPalette.hoodieDark} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <ellipse cx={hoodX + 0.6} cy={prop.y - 1.9} rx={1.2} ry={1.3} fill={schlonicPalette.skin} />
      {/* The arm out over the body, and the sandal in its hand. */}
      <path d={`M ${hoodX - 1} ${top + 1.8} Q ${hoodX - 4} ${top + 1} ${hoodX - 6} ${top + 2.6}`} fill="none" stroke={schlonicPalette.hoodie} strokeWidth={1.4} strokeLinecap="round" />
      <path d={`M ${hoodX - 1} ${top + 1.8} Q ${hoodX - 4} ${top + 1} ${hoodX - 6} ${top + 2.6}`} fill="none" stroke={schlonicPalette.hoodieDark} strokeWidth={0.35} strokeLinecap="round" opacity={0.6} />
      <ellipse cx={hoodX - 6.6} cy={top + 3} rx={0.9} ry={0.7} fill={schlonicPalette.skin} />
      <rect x={hoodX - 8.6} y={top + 2.9} width={2.8} height={1} rx={0.4} fill={schlonicPalette.sandal} />
    </g>
  );
};
