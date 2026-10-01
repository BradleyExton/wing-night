import { BRAWL_WORLD } from "@wingnight/shared";

import { brawlNight } from "../../palette.js";
import { STREET_BANDS } from "../layout/index.js";

/** The dashes of the chalk line across the near sidewalk. */
const DASHES = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * Where the block ends: a chalk line across the near sidewalk at `handoffX`, the line the hen has
 * to reach once the last wave is down and where the next teammate is waiting. A chevron chalked
 * on the street before it points the way, under the GO arrow's own direction.
 */
export const HandoffLine = ({ x }: { x: number }): JSX.Element => {
  const top = STREET_BANDS.kerbBottom + 0.6;
  const dash = (STREET_BANDS.bottom - top) / DASHES.length;

  return (
    <g data-brawl-handoff={x} aria-hidden="true">
      {DASHES.map((index) => (
        <rect
          key={index}
          x={x - 0.7 + index * 0.15}
          y={top + index * dash}
          width={1.4}
          height={dash * 0.62}
          fill={brawlNight.chalk}
        />
      ))}
      <path
        d={`M ${x - 12} ${BRAWL_WORLD.groundY + 9} l 4 3 l -4 3 M ${x - 7} ${BRAWL_WORLD.groundY + 9} l 4 3 l -4 3`}
        fill="none"
        stroke={brawlNight.chalk}
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </g>
  );
};
