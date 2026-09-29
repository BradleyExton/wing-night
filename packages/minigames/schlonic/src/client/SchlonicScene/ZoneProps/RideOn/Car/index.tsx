import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";
import { resolveSchlonicGroundY } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";

const OUTLINE = 0.5;
const WHEEL = 2.1;

/**
 * A sedan parked half up on the curb, side on, its roof level at `y` from `x` to `toX`: the
 * board comes down on the roof and grinds the length of it. Silver, so it is not the rail's
 * steel; a trunk lower than the hood, so it reads as a car and not a box.
 */
export const Car = ({ prop, zone }: { prop: SchlonicProp; zone: SchlonicZone }): JSX.Element => {
  const toX = prop.toX ?? prop.x;
  const groundY = resolveSchlonicGroundY(zone, prop.x);
  const width = toX - prop.x;
  // The body sits over the wheels; the roof is the cabin's, set in from both ends.
  const bodyTop = groundY - WHEEL * 2 - 4.2;
  const cabinFrom = prop.x + 1;
  const cabinTo = toX - 1;
  const trunkFrom = prop.x - 5;
  const hoodTo = toX + 7;
  const shell = `M ${trunkFrom} ${groundY - WHEEL} L ${trunkFrom + 0.6} ${bodyTop} L ${cabinFrom - 2} ${bodyTop} L ${cabinFrom} ${prop.y} L ${cabinTo} ${prop.y} L ${cabinTo + 3.5} ${bodyTop} L ${hoodTo - 0.8} ${bodyTop + 0.8} L ${hoodTo} ${groundY - WHEEL} Z`;
  const wheels = [trunkFrom + 5, hoodTo - 5].map((x) => ({ x, y: resolveSchlonicGroundY(zone, x) - WHEEL }));

  return (
    <g>
      <GroundShadow x={(trunkFrom + hoodTo) / 2} y={groundY} radius={(hoodTo - trunkFrom) * 0.5} />
      <path d={shell} fill={schlonicPalette.carBody} stroke={schlonicPalette.carBodyDark} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {/* The glass: rear, then the doors' windows, then the windshield. */}
      <path d={`M ${cabinFrom - 1} ${bodyTop + 0.3} L ${cabinFrom + 0.8} ${prop.y + 0.6} L ${cabinFrom + width * 0.45} ${prop.y + 0.6} L ${cabinFrom + width * 0.45} ${bodyTop + 0.3} Z`} fill={schlonicPalette.carGlass} />
      <path d={`M ${cabinFrom + width * 0.5} ${bodyTop + 0.3} L ${cabinFrom + width * 0.5} ${prop.y + 0.6} L ${cabinTo - 0.8} ${prop.y + 0.6} L ${cabinTo + 2.4} ${bodyTop + 0.3} Z`} fill={schlonicPalette.carGlass} />
      {/* The door line and the handles. */}
      <path d={`M ${cabinFrom + width * 0.47} ${bodyTop + 0.3} L ${cabinFrom + width * 0.47} ${groundY - WHEEL - 0.4}`} stroke={schlonicPalette.carBodyDark} strokeWidth={0.4} />
      <rect x={cabinFrom + width * 0.3} y={bodyTop + 1.4} width={1.8} height={0.5} rx={0.2} fill={schlonicPalette.carBodyDark} />
      <rect x={cabinFrom + width * 0.62} y={bodyTop + 1.4} width={1.8} height={0.5} rx={0.2} fill={schlonicPalette.carBodyDark} />
      {/* Lights. */}
      <rect x={hoodTo - 1.6} y={bodyTop + 1.6} width={1.4} height={1.2} rx={0.3} fill={schlonicPalette.carLight} />
      <rect x={trunkFrom + 0.4} y={bodyTop + 1.4} width={1.2} height={1.2} rx={0.3} fill={schlonicPalette.canLabel} />
      {wheels.map((wheel) => (
        <g key={wheel.x}>
          <circle cx={wheel.x} cy={wheel.y} r={WHEEL} fill={schlonicPalette.carTyre} />
          <circle cx={wheel.x} cy={wheel.y} r={WHEEL * 0.5} fill={schlonicPalette.stud} />
        </g>
      ))}
    </g>
  );
};
