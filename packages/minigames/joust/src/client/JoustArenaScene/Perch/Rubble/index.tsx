import type { JoustPerch } from "@wingnight/shared";
import { JOUST_LEG_RADIUS, JOUST_WORLD } from "@wingnight/shared";

import { joustPalette } from "../../palette.js";
import { PerchShade } from "../PerchShade/index.js";
import { plankPath } from "../plankPath/index.js";

/** How high a fallen plank's far end is propped, and how far a splayed leg reaches past the span. */
const PROP_HEIGHT = 7;
const LEG_SPLAY = 6;

/**
 * A tower somebody folded, left in the lane where it came down. The plank is propped on one
 * folded leg, so wreckage pokes up past the players lying on it instead of vanishing under them;
 * the other leg lies flat out the far side.
 */
export const Rubble = ({ perch }: { perch: JoustPerch }): JSX.Element => {
  const groundY = JOUST_WORLD.floorY - JOUST_LEG_RADIUS;
  const propX = perch.x + perch.width * 0.7;
  const propTop = { x: propX, y: JOUST_WORLD.floorY - PROP_HEIGHT };

  return (
    <g data-joust-rubble>
      <PerchShade perch={perch} />
      <line
        x1={perch.x + perch.width - 1}
        y1={groundY}
        x2={perch.x + perch.width + LEG_SPLAY}
        y2={groundY - 1.4}
        stroke={joustPalette.postDark}
        strokeWidth={JOUST_LEG_RADIUS * 2}
        strokeLinecap="round"
      />
      <line
        x1={propX - PROP_HEIGHT * 0.6}
        y1={groundY}
        x2={propTop.x}
        y2={propTop.y}
        stroke={joustPalette.postDark}
        strokeWidth={JOUST_LEG_RADIUS * 2}
        strokeLinecap="round"
      />
      <path
        d={plankPath({ x: perch.x, y: JOUST_WORLD.floorY }, { x: perch.x + perch.width, y: propTop.y - JOUST_LEG_RADIUS })}
        fill={joustPalette.post}
        stroke={joustPalette.postDark}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
    </g>
  );
};
