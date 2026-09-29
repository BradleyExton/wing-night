import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../../palette.js";
import { GroundShadow } from "../GroundShadow/index.js";

const OUTLINE = 0.5;

/**
 * The kicker: a plywood wedge on a timber frame, the kind that lives outside every skate shop,
 * its lip at the far side. Nobody jumps at a kicker — you roll into it and it throws you — so
 * it asks nothing of the tablet and everything of the line you chose. Plywood and a dark frame,
 * so it reads as a ramp and not as one more thing to clear.
 */
export const Kicker = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { kickerWidth, kickerHeight } = SCHLONIC_WORLD;
  const left = prop.x - kickerWidth / 2;
  const right = prop.x + kickerWidth / 2;
  const lipY = prop.y - kickerHeight;
  const wedge = `M ${left} ${prop.y} Q ${right - 3.5} ${prop.y - 0.6} ${right} ${lipY} L ${right} ${prop.y} Z`;

  return (
    <g data-schlonic-kicker={prop.index}>
      <GroundShadow x={prop.x} y={prop.y} radius={kickerWidth * 0.55} />
      <path d={wedge} fill={schlonicPalette.ply} stroke={schlonicPalette.kickerFrame} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {/* The frame's struts, seen through the open side, and the coping on the lip. */}
      <path d={`M ${right - 1} ${prop.y - 0.4} L ${right - 1} ${lipY + 1.2} M ${right - 4} ${prop.y - 0.4} L ${right - 4} ${prop.y - 2.6}`} stroke={schlonicPalette.kickerFrame} strokeWidth={0.5} />
      <rect x={right - 0.8} y={lipY - 0.35} width={1.6} height={0.7} rx={0.3} fill={schlonicPalette.steelInk} />
      <path d={`M ${left + 2} ${prop.y - 0.3} Q ${right - 3.8} ${prop.y - 0.9} ${right - 0.6} ${lipY + 0.5}`} fill="none" stroke={schlonicPalette.deckFlash} strokeWidth={0.3} opacity={0.6} />
    </g>
  );
};
