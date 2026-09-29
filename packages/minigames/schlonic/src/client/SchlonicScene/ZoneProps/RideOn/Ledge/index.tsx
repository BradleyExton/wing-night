import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";
import { resolveSchlonicGroundY } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";

const OUTLINE = 0.45;
const LIP = 1.3;

/**
 * A concrete planter, the long low kind along the front of the bank: its lip level at `y` from
 * `x` to `toX`, the box under it down to the ground, and the hedge showing behind the lip,
 * lower than it, so the top still reads flat. The easiest landing on the street.
 */
export const Ledge = ({ prop, zone }: { prop: SchlonicProp; zone: SchlonicZone }): JSX.Element => {
  const toX = prop.toX ?? prop.x;
  const groundY = Math.max(resolveSchlonicGroundY(zone, prop.x), resolveSchlonicGroundY(zone, toX));
  const width = toX - prop.x;
  const hedge = Array.from({ length: Math.max(1, Math.floor(width / 4)) }, (_unused, index) => prop.x + 2 + index * 4);

  return (
    <g>
      {/* The hedge, behind the lip. */}
      {hedge.map((x) => (
        <circle key={x} cx={x} cy={prop.y - 0.6} r={1.9} fill={schlonicPalette.hedge} stroke={schlonicPalette.hedgeDark} strokeWidth={OUTLINE * 0.7} />
      ))}
      <rect x={prop.x + 0.4} y={prop.y + LIP} width={width - 0.8} height={groundY - prop.y - LIP} fill={schlonicPalette.concrete} stroke={schlonicPalette.concreteJoint} strokeWidth={OUTLINE} />
      <rect x={prop.x} y={prop.y} width={width} height={LIP} rx={0.3} fill={schlonicPalette.concreteLight} stroke={schlonicPalette.concreteJoint} strokeWidth={OUTLINE} />
      <path d={`M ${prop.x + 0.6} ${prop.y + LIP + 1} L ${prop.x + 0.6} ${groundY - 0.4}`} stroke={schlonicPalette.curbShadow} strokeWidth={0.4} opacity={0.5} />
    </g>
  );
};
