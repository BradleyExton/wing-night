import type { SchlongVec2 } from "@wingnight/cast";
import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { GroundShadow } from "../GroundShadow/index.js";
import { CRIMSON, SchlongBody } from "../SchlongBody/index.js";

const HEAD_RADIUS = 1.5;
const SHAFT_RADIUS = 1.1;
const THORNS_PER_BED = 3;

/**
 * The thorn bed: the same creature, stubbier and crimson, several of them splayed out of the
 * turf with no face on any of them. It is scenery, not an enemy — there is no squashing it, and
 * it costs you half the handful however you arrive.
 */
export const Thorns = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { spikeWidth, spikeHeight } = SCHLONIC_WORLD;
  const left = prop.x - spikeWidth / 2;
  const step = spikeWidth / THORNS_PER_BED;

  return (
    <g data-schlonic-spike={prop.index}>
      <GroundShadow x={prop.x} y={prop.y} radius={spikeWidth * 0.5} />
      {Array.from({ length: THORNS_PER_BED }, (_unused, index) => {
        const rootX = left + step * (index + 0.5);
        // They splay: the outer two lean away from the middle, so the bed reads as a bed.
        const lean = (index - (THORNS_PER_BED - 1) / 2) * 2.8;
        const head: SchlongVec2 = { x: rootX + lean, y: prop.y - spikeHeight + HEAD_RADIUS };
        const base: SchlongVec2 = { x: rootX, y: prop.y - 0.2 };

        return (
          <SchlongBody
            key={index}
            spine={[base, { x: rootX + lean * 0.5, y: (base.y + head.y) / 2 }, head]}
            shaftRadius={SHAFT_RADIUS}
            headRadius={HEAD_RADIUS}
            skin={CRIMSON}
          />
        );
      })}
    </g>
  );
};
