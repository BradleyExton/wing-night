import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { resolveGroundSegments } from "../groundPaths/index.js";
import { schlonicPalette } from "../palette.js";

// The zone's floor: park turf over the bay's own sandy bluff over the clay under that, cut clean
// at every pit so a hole reads as two lips and a drop rather than a dark patch — and so a hole is
// a bite out of the shoreline, sand showing at the edges, the way the real bluffs go. Built once
// per zone; the scene scrolls it.
//
// Under every hole is a shaft of dark. Without it the backdrop's park showed through the gap,
// and from the sofa a pit read as a bright green pillar standing in the ground rather than as
// a drop out of it.
//
// The floor keeps going a screen past its last sample: the sim's ground is level forever out
// there, and a cleared run used to stand at the post looking at a cliff edge into the park.
const RUN_OUT = SCHLONIC_WORLD.width;

export const Ground = ({ zone }: { zone: SchlonicZone }): JSX.Element => {
  const segments = resolveGroundSegments(zone, SCHLONIC_WORLD.height, RUN_OUT);

  return (
    <g data-schlonic-ground>
      {zone.pits.map((pit) => (
        <rect
          key={pit.fromX}
          data-schlonic-pit={pit.fromX}
          x={pit.fromX}
          y={pit.lipY}
          width={pit.toX - pit.fromX}
          height={SCHLONIC_WORLD.height - pit.lipY}
          fill={schlonicPalette.pitShaft}
        />
      ))}
      {segments.map((segment) => (
        <g key={segment.fromX} data-schlonic-ground-run={segment.fromX}>
          <path d={segment.fillPath} fill={schlonicPalette.soil} />
          <path d={segment.bluffPath} fill={schlonicPalette.bluffSand} />
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
