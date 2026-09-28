import { useId } from "react";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import type { SchlonicCamera } from "../camera/index.js";
import { BLUFF_DEPTH, resolveGroundSegments } from "../groundPaths/index.js";
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
// The floor keeps going a camera's width past its last sample: the sim's ground is level forever
// out there, and a cleared run used to stand at the post looking at a cliff edge into the park.
// It is filled down to the camera's own floor, which on the wall sits below the sim's box.
//
// Under the sand the clay wears Green Hill's checkerboard for a band: the one thing on the
// shore that says "16-bit Sonic" before anything moves (§2.11). The squares stay square to the
// screen on a slope, the way the original's do; only the band's edges follow the ground. The
// rows are laid from the band's top edge on the flat, so level ground shows two whole rows.
const CHECKER_SQUARE = 5;
const CHECKER_ROWS_FROM_Y = SCHLONIC_WORLD.groundBaseY + BLUFF_DEPTH;

export const Ground = ({ zone, camera }: { zone: SchlonicZone; camera: SchlonicCamera }): JSX.Element => {
  const bottomY = camera.y + camera.height;
  const segments = resolveGroundSegments(zone, bottomY, camera.width);
  const checkerId = `schlonic-checker${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <g data-schlonic-ground>
      <defs>
        <pattern
          id={checkerId}
          patternUnits="userSpaceOnUse"
          y={CHECKER_ROWS_FROM_Y}
          width={CHECKER_SQUARE * 2}
          height={CHECKER_SQUARE * 2}
        >
          <rect width={CHECKER_SQUARE * 2} height={CHECKER_SQUARE * 2} fill={schlonicPalette.soil} />
          <rect width={CHECKER_SQUARE} height={CHECKER_SQUARE} fill={schlonicPalette.soilChecker} />
          <rect
            x={CHECKER_SQUARE}
            y={CHECKER_SQUARE}
            width={CHECKER_SQUARE}
            height={CHECKER_SQUARE}
            fill={schlonicPalette.soilChecker}
          />
        </pattern>
      </defs>
      {zone.pits.map((pit) => (
        <rect
          key={pit.fromX}
          data-schlonic-pit={pit.fromX}
          x={pit.fromX}
          y={pit.lipY}
          width={pit.toX - pit.fromX}
          height={bottomY - pit.lipY}
          fill={schlonicPalette.pitShaft}
        />
      ))}
      {segments.map((segment) => (
        <g key={segment.fromX} data-schlonic-ground-run={segment.fromX}>
          <path d={segment.fillPath} fill={schlonicPalette.soil} />
          <path d={segment.checkerPath} fill={`url(#${checkerId})`} data-schlonic-checker />
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
