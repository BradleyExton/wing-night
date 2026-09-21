import type { SchlongVec2 } from "@wingnight/cast";
import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../../palette.js";
import { GroundShadow } from "../GroundShadow/index.js";
import { OUTLINE_WIDTH, PINK, SchlongBody } from "../SchlongBody/index.js";
import { SchlongFace } from "../SchlongFace/index.js";

const HEAD_RADIUS = 2.4;
const SHAFT_RADIUS = 1.7;
const BALL_RADIUS = 1.7;

/**
 * The enemy: a schlong standing up out of the turf on its own balls, leaning back a little, with
 * a face on the glans that watches the runner come. Squashed by anything that lands on it — which
 * is to say by a bird in a ball, which is the whole reason for jumping on one.
 */
export const Badnik = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const top = prop.y - SCHLONIC_WORLD.badnikHeight;
  const head: SchlongVec2 = { x: prop.x - 0.5, y: top + HEAD_RADIUS };
  const base: SchlongVec2 = { x: prop.x + 0.6, y: prop.y - 0.4 };
  const height = base.y - head.y;
  const spine: SchlongVec2[] = [
    base,
    { x: prop.x + 0.9, y: base.y - height * 0.35 },
    { x: prop.x + 0.4, y: base.y - height * 0.7 },
    head
  ];

  return (
    <g data-schlonic-badnik={prop.index}>
      <GroundShadow x={prop.x} y={prop.y} radius={SCHLONIC_WORLD.badnikWidth * 0.62} />
      {[prop.x - 1.9, prop.x + 2.1].map((ballX) => (
        <circle
          key={ballX}
          cx={ballX}
          cy={prop.y - BALL_RADIUS + 0.2}
          r={BALL_RADIUS}
          fill={schlonicPalette.schlong}
          stroke={schlonicPalette.schlongDark}
          strokeWidth={OUTLINE_WIDTH}
        />
      ))}
      <SchlongBody spine={spine} shaftRadius={SHAFT_RADIUS} headRadius={HEAD_RADIUS} skin={PINK} />
      {/* It is looking back down the zone, at whatever is coming. */}
      <SchlongFace head={head} headRadius={HEAD_RADIUS} lookAt={{ x: head.x - 30, y: head.y }} />
    </g>
  );
};
