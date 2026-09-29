import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_HAZARDS } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";

const OUTLINE = 0.5;

/**
 * A dome tent pitched on the sidewalk, the way they are on Dunlop: a red fly with a seam down
 * it and a zipped door, a blue tarp lumped beside it, and one of the dig's pylons that ended up
 * out front. Wide and not tall, so it is jumped from well back; nothing on it is flat.
 */
export const Tent = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { width, height } = SCHLONIC_HAZARDS.tent;
  const left = prop.x - width / 2;
  const domeLeft = left + 2;
  const domeWidth = 12;
  const domeX = domeLeft + domeWidth / 2;
  const top = prop.y - height;
  const dome = `M ${domeLeft} ${prop.y} Q ${domeLeft} ${top} ${domeX} ${top} Q ${domeLeft + domeWidth} ${top} ${domeLeft + domeWidth} ${prop.y} Z`;
  const tarpLeft = domeLeft + domeWidth - 0.5;
  const tarp = `M ${tarpLeft} ${prop.y} Q ${tarpLeft + 1} ${prop.y - 4} ${tarpLeft + 3} ${prop.y - 3.6} Q ${tarpLeft + 5} ${prop.y - 4.4} ${tarpLeft + 6} ${prop.y} Z`;
  const pylonX = left + width - 1.4;

  return (
    <g>
      <GroundShadow x={prop.x} y={prop.y} radius={width * 0.5} />
      <path d={dome} fill={schlonicPalette.tentRed} stroke={schlonicPalette.tentRedDark} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {/* The fly's seams, and the door zipped shut down the middle. */}
      <path d={`M ${domeX} ${top} L ${domeX} ${prop.y}`} stroke={schlonicPalette.tentSeam} strokeWidth={0.35} />
      <path d={`M ${domeX} ${top + 0.4} Q ${domeLeft + 1.6} ${top + 2.2} ${domeLeft + 1} ${prop.y}`} fill="none" stroke={schlonicPalette.tentRedDark} strokeWidth={0.35} opacity={0.6} />
      <path d={`M ${domeX} ${top + 0.4} Q ${domeLeft + domeWidth - 1.6} ${top + 2.2} ${domeLeft + domeWidth - 1} ${prop.y}`} fill="none" stroke={schlonicPalette.tentRedDark} strokeWidth={0.35} opacity={0.6} />
      <path d={`M ${domeX - 1.6} ${prop.y} L ${domeX - 1} ${top + 3.4} L ${domeX + 1} ${top + 3.4} L ${domeX + 1.6} ${prop.y} Z`} fill={schlonicPalette.tentRedDark} opacity={0.55} />
      {/* The tarp. */}
      <path d={tarp} fill={schlonicPalette.tarp} stroke={schlonicPalette.tarpDark} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {/* The pylon. */}
      <path d={`M ${pylonX - 1.3} ${prop.y} L ${pylonX - 0.6} ${prop.y - 4.2} L ${pylonX + 0.6} ${prop.y - 4.2} L ${pylonX + 1.3} ${prop.y} Z`} fill={schlonicPalette.hardHat} stroke={schlonicPalette.hardHatDark} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <rect x={pylonX - 0.95} y={prop.y - 2.6} width={1.9} height={0.7} fill={schlonicPalette.barrelStripe} />
      <rect x={pylonX - 1.8} y={prop.y - 0.5} width={3.6} height={0.5} fill={schlonicPalette.hardHatDark} />
    </g>
  );
};
