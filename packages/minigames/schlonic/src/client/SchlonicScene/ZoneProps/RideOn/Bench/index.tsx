import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";
import { resolveSchlonicGroundY } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";

const OUTLINE = 0.45;
const SLAT = 1.1;
const SLAT_GAP = 0.5;
/** The iron ends stand this far in from each end of the slats. */
const END_INSET = 2.2;

/**
 * A park bench, side on: three timber slats on two cast-iron ends, its top slat level at `y`
 * from `x` to `toX` — exactly the ledge the sim catches a falling board on — with the backrest
 * left off, because a back would stand up over the line the board rides and read as something
 * to clear. Flat on top: the whole read.
 */
export const Bench = ({ prop, zone }: { prop: SchlonicProp; zone: SchlonicZone }): JSX.Element => {
  const toX = prop.toX ?? prop.x;
  const ends = [prop.x + END_INSET, toX - END_INSET].map((x) => ({ x, groundY: resolveSchlonicGroundY(zone, x) }));

  return (
    <g>
      {ends.map((end) => (
        <GroundShadow key={end.x} x={end.x} y={end.groundY} radius={2} />
      ))}
      {ends.map((end) => (
        <g key={end.x}>
          <path
            d={`M ${end.x - 1.4} ${end.groundY} L ${end.x - 1} ${prop.y + 0.6} L ${end.x + 1} ${prop.y + 0.6} L ${end.x + 1.4} ${end.groundY} Z`}
            fill={schlonicPalette.benchIron}
          />
          <rect x={end.x - 1.9} y={end.groundY - 0.6} width={3.8} height={0.6} rx={0.2} fill={schlonicPalette.benchIron} />
        </g>
      ))}
      {[0, 1, 2].map((slat) => (
        <rect
          key={slat}
          x={prop.x}
          y={prop.y + slat * (SLAT + SLAT_GAP)}
          width={toX - prop.x}
          height={SLAT}
          rx={0.25}
          fill={schlonicPalette.benchWood}
          stroke={schlonicPalette.benchWoodDark}
          strokeWidth={OUTLINE}
        />
      ))}
      <rect x={prop.x + 0.3} y={prop.y + 0.2} width={toX - prop.x - 0.6} height={0.3} fill={schlonicPalette.ply} opacity={0.6} />
    </g>
  );
};
