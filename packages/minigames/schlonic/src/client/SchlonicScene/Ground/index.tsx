import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { resolveGroundSegments } from "../groundPaths/index.js";
import { schlonicPalette } from "../palette.js";

// The zone's floor: soil under a band of turf, cut clean at every pit so a hole reads as two
// lips and a drop rather than a dark patch. Built once per zone; the scene scrolls it.
export const Ground = ({ zone }: { zone: SchlonicZone }): JSX.Element => {
  const segments = resolveGroundSegments(zone, SCHLONIC_WORLD.height);

  return (
    <g data-schlonic-ground>
      {segments.map((segment) => (
        <g key={segment.fromX} data-schlonic-ground-run={segment.fromX}>
          <path d={segment.fillPath} fill={schlonicPalette.soil} />
          <path
            d={segment.topPath}
            fill="none"
            stroke={schlonicPalette.turf}
            strokeWidth={4}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
          <path
            d={segment.topPath}
            fill="none"
            stroke={schlonicPalette.turfLight}
            strokeWidth={1.2}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );
};
