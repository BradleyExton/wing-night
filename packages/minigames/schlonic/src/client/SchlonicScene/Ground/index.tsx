import { useId } from "react";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import type { SchlonicCamera } from "../camera/index.js";
import { SIDEWALK_DEPTH, resolveGroundSegments } from "../groundPaths/index.js";
import { schlonicPalette } from "../palette.js";
import { Roadworks } from "./Roadworks/index.js";

// The zone's floor: Dunlop Street's sidewalk, poured concrete in slabs over a band of red-brick
// pavers over the subgrade, cut clean at every trench so a hole reads as two lips and a drop
// rather than a dark patch — and so every cut shows its layers, the way a real dig does. Built
// once per zone; the scene scrolls it.
//
// Under every hole is a shaft of dark. Without it the road behind showed through the gap, and
// from the sofa a trench read as a grey pillar standing in the ground rather than a drop out of
// it. Round every hole stand the roadworks (`Roadworks`) — barrels and a sawhorse — which are
// dressing and stand on solid ground either side, never over the gap.
//
// The floor keeps going a camera's width past its last sample: the sim's ground is level forever
// out there, and a cleared run used to stand at the post looking at a cliff edge into the road.
// It is filled down to the camera's own floor, which on the wall sits below the sim's box.
//
// Under the concrete the pavers wear Green Hill's checkerboard for a band: the one thing on the
// street that says "16-bit Sonic" before anything moves (§2.11), laid in two fired reds with the
// mortar between them. The squares stay square to the screen on a slope, the way the original's
// do; only the band's edges follow the ground. The rows are laid from the band's top edge on the
// flat, so level ground shows two whole rows. The sidewalk's slab joints are the same: square to
// the screen, one every `SLAB_WIDTH`, so a slope reads as a ramp of slabs rather than a smear.
const CHECKER_SQUARE = 5;
const CHECKER_ROWS_FROM_Y = SCHLONIC_WORLD.groundBaseY + SIDEWALK_DEPTH;
const SLAB_WIDTH = 8;
/** The sunlit lip along the top of the sidewalk: half of it above the riding line, half below. */
const LIP_WIDTH = 1.5;

export const Ground = ({ zone, camera }: { zone: SchlonicZone; camera: SchlonicCamera }): JSX.Element => {
  const bottomY = camera.y + camera.height;
  const segments = resolveGroundSegments(zone, bottomY, camera.width);
  const idSuffix = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const checkerId = `schlonic-checker${idSuffix}`;
  const slabsId = `schlonic-slabs${idSuffix}`;

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
          <g stroke={schlonicPalette.mortar} strokeWidth={0.36}>
            <rect width={CHECKER_SQUARE} height={CHECKER_SQUARE} fill={schlonicPalette.paver} />
            <rect x={CHECKER_SQUARE} width={CHECKER_SQUARE} height={CHECKER_SQUARE} fill={schlonicPalette.paverDark} />
            <rect y={CHECKER_SQUARE} width={CHECKER_SQUARE} height={CHECKER_SQUARE} fill={schlonicPalette.paverDark} />
            <rect
              x={CHECKER_SQUARE}
              y={CHECKER_SQUARE}
              width={CHECKER_SQUARE}
              height={CHECKER_SQUARE}
              fill={schlonicPalette.paver}
            />
          </g>
        </pattern>
        <pattern id={slabsId} patternUnits="userSpaceOnUse" width={SLAB_WIDTH} height={SCHLONIC_WORLD.height * 2}>
          <rect width={SLAB_WIDTH} height={SCHLONIC_WORLD.height * 2} fill={schlonicPalette.concrete} />
          <rect width={0.34} height={SCHLONIC_WORLD.height * 2} fill={schlonicPalette.concreteJoint} />
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
      <Roadworks zone={zone} />
      {segments.map((segment) => (
        <g key={segment.fromX} data-schlonic-ground-run={segment.fromX}>
          <path d={segment.fillPath} fill={schlonicPalette.subgrade} />
          <path
            d={segment.checkerPath}
            fill={`url(#${checkerId})`}
            stroke={schlonicPalette.mortar}
            strokeWidth={0.5}
            strokeLinejoin="round"
            data-schlonic-checker
          />
          <path d={segment.sidewalkPath} fill={`url(#${slabsId})`} data-schlonic-sidewalk />
          <path
            d={segment.topPath}
            fill="none"
            stroke={schlonicPalette.concreteLight}
            strokeWidth={LIP_WIDTH}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );
};
