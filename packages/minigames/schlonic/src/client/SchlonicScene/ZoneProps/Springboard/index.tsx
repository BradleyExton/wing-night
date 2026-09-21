import type { SchlongVec2 } from "@wingnight/cast";
import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../../palette.js";
import { GroundShadow } from "../GroundShadow/index.js";
import { OUTLINE_WIDTH, PINK, SchlongBody } from "../SchlongBody/index.js";

const HEAD_RADIUS = 2.1;
const SHAFT_RADIUS = 1.6;

/**
 * The springboard: a schlong arched back out of the turf with a red-and-white pad strapped over
 * the glans. The pad is the whole signal — the body is the same pink as the enemy, so the stripe
 * is what tells the room that this one is on their side.
 */
export const Springboard = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { springWidth, springHeight } = SCHLONIC_WORLD;
  const head: SchlongVec2 = { x: prop.x + 2.4, y: prop.y - springHeight + HEAD_RADIUS };
  const base: SchlongVec2 = { x: prop.x - springWidth / 2, y: prop.y - 0.4 };
  const padHalf = HEAD_RADIUS * 1.25;

  return (
    <g data-schlonic-spring={prop.index}>
      <GroundShadow x={prop.x} y={prop.y} radius={springWidth * 0.55} />
      <SchlongBody
        spine={[
          base,
          { x: prop.x - 2.4, y: prop.y - springHeight * 0.45 },
          { x: prop.x - 0.4, y: prop.y - springHeight * 0.8 },
          head
        ]}
        shaftRadius={SHAFT_RADIUS}
        headRadius={HEAD_RADIUS}
        skin={PINK}
      />
      <rect
        x={head.x - padHalf}
        y={head.y - HEAD_RADIUS - 1.2}
        width={padHalf * 2}
        height={1.9}
        rx={0.5}
        fill={schlonicPalette.pad}
        stroke={schlonicPalette.padDark}
        strokeWidth={OUTLINE_WIDTH}
      />
      <rect
        x={head.x - padHalf * 0.45}
        y={head.y - HEAD_RADIUS - 1}
        width={padHalf * 0.9}
        height={1.5}
        fill={schlonicPalette.padStripe}
      />
    </g>
  );
};
