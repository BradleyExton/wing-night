import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_HAZARDS } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";

const OUTLINE = 0.5;

/** A dome tent standing on `baseY`, `width` across and `height` up at its crown, zipped shut. */
const Dome = ({
  left,
  width,
  height,
  baseY,
  fill,
  dark
}: {
  left: number;
  width: number;
  height: number;
  baseY: number;
  fill: string;
  dark: string;
}): JSX.Element => {
  const right = left + width;
  const middle = left + width / 2;
  const top = baseY - height;
  const door = width * 0.13;

  return (
    <g>
      <path
        d={`M ${left} ${baseY} Q ${left} ${top} ${middle} ${top} Q ${right} ${top} ${right} ${baseY} Z`}
        fill={fill}
        stroke={dark}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />
      {/* The poles under the fly, and the door zipped shut down the middle. */}
      <path d={`M ${middle} ${top + 0.4} Q ${left + 1.4} ${top + height * 0.25} ${left + 0.9} ${baseY}`} fill="none" stroke={dark} strokeWidth={0.35} opacity={0.6} />
      <path d={`M ${middle} ${top + 0.4} Q ${right - 1.4} ${top + height * 0.25} ${right - 0.9} ${baseY}`} fill="none" stroke={dark} strokeWidth={0.35} opacity={0.6} />
      <path d={`M ${middle} ${top} L ${middle} ${baseY}`} stroke={schlonicPalette.tentSeam} strokeWidth={0.35} />
      <path d={`M ${middle - door * 1.3} ${baseY} L ${middle - door} ${top + height * 0.4} L ${middle + door} ${top + height * 0.4} L ${middle + door * 1.3} ${baseY} Z`} fill={dark} opacity={0.55} />
    </g>
  );
};

/**
 * A tent city on the sidewalk, the way the encampment on Dunlop is: a red dome at the front,
 * a faded green one pitched behind it, and a blue tarp strung off a shopping cart for a third
 * roof. One huddle, one hop — wide and low, and nothing on it is flat. Drawn as it is; no joke
 * is told about it.
 */
export const Tent = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { width, height } = SCHLONIC_HAZARDS.tent;
  const left = prop.x - width / 2;
  const right = left + width;
  const baseY = prop.y;
  // The cart at the far end, the tarp slung from its handle down to the pavers.
  const cartLeft = right - 6.2;
  const cartTop = baseY - 4.4;
  const tarp = `M ${left + 9.5} ${baseY} Q ${left + 11} ${baseY - 4.6} ${cartLeft + 0.6} ${cartTop - 0.4} L ${cartLeft + 1.6} ${baseY} Z`;

  return (
    <g>
      <GroundShadow x={prop.x} y={baseY} radius={width * 0.5} />
      {/* The green one, behind and to the left: smaller, older, sun-bleached. */}
      <Dome left={left + 0.4} width={9} height={height - 1.6} baseY={baseY} fill={schlonicPalette.tentGreen} dark={schlonicPalette.tentGreenDark} />
      {/* The tarp lean-to, strung off the cart. */}
      <path d={tarp} fill={schlonicPalette.tarp} stroke={schlonicPalette.tarpDark} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <path d={`M ${left + 12.4} ${baseY - 3.2} L ${left + 12.8} ${baseY}`} stroke={schlonicPalette.tarpDark} strokeWidth={0.35} opacity={0.6} />
      {/* The cart: a wire basket on two wheels, its handle up where the tarp is tied. */}
      <g stroke={schlonicPalette.cartDark} strokeLinejoin="round">
        <path d={`M ${cartLeft} ${cartTop} L ${right - 0.2} ${cartTop} L ${right - 1} ${baseY - 1.5} L ${cartLeft + 1.4} ${baseY - 1.5} Z`} fill={schlonicPalette.cart} fillOpacity={0.35} strokeWidth={0.45} />
        <path d={`M ${cartLeft + 2} ${cartTop} L ${cartLeft + 2.6} ${baseY - 1.5} M ${cartLeft + 3.8} ${cartTop} L ${cartLeft + 4.1} ${baseY - 1.5} M ${cartLeft + 0.6} ${baseY - 3} L ${right - 0.6} ${baseY - 3}`} strokeWidth={0.25} />
        <path d={`M ${cartLeft} ${cartTop} L ${cartLeft - 0.8} ${cartTop - 1}`} strokeWidth={0.5} strokeLinecap="round" />
      </g>
      <circle cx={cartLeft + 1.8} cy={baseY - 0.6} r={0.6} fill={schlonicPalette.cartDark} />
      <circle cx={right - 1.4} cy={baseY - 0.6} r={0.6} fill={schlonicPalette.cartDark} />
      {/* The red one, out front and tallest: the crown is the top of the box. */}
      <Dome left={left + 4.6} width={10.4} height={height} baseY={baseY} fill={schlonicPalette.tentRed} dark={schlonicPalette.tentRedDark} />
    </g>
  );
};
