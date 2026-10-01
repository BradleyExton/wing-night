import { BRAWL_WORLD } from "@wingnight/shared";

import { brawlNight } from "../../palette.js";

/** How tall a lamp post stands off the sidewalk's back edge, and how far its arm reaches over the street. */
const POST_HEIGHT = 36;
const ARM_REACH = 5;

/**
 * The street lamps along the back of the near sidewalk: a dark post, an arm out over the road, a
 * hot head and a soft pool of light. They are what makes the street read as night rather than as
 * a dim day — and they stand behind the fight, never in it.
 */
export const Lamps = ({ xs, baseY }: { xs: readonly number[]; baseY: number }): JSX.Element => (
  <g data-brawl-lamps aria-hidden="true">
    {xs.map((x) => {
      const top = baseY - POST_HEIGHT;

      return (
        <g key={x}>
          <ellipse cx={x + ARM_REACH} cy={BRAWL_WORLD.groundY + 2} rx={16} ry={4.5} fill={brawlNight.lampGlow} />
          <circle cx={x + ARM_REACH} cy={top + 2} r={6} fill={brawlNight.lampGlow} />
          <circle cx={x + ARM_REACH} cy={top + 2} r={3.2} fill={brawlNight.lampGlow} />
          <rect x={x - 0.5} y={top} width={1} height={POST_HEIGHT} fill={brawlNight.post} />
          <rect x={x - 1.1} y={baseY - 1.2} width={2.2} height={1.2} fill={brawlNight.post} />
          <path d={`M ${x} ${top + 0.6} Q ${x + ARM_REACH / 2} ${top - 1.4} ${x + ARM_REACH} ${top + 0.6}`} fill="none" stroke={brawlNight.post} strokeWidth={0.7} />
          <path d={`M ${x + ARM_REACH - 1.6} ${top + 0.6} L ${x + ARM_REACH + 1.6} ${top + 0.6} L ${x + ARM_REACH + 0.9} ${top + 2} L ${x + ARM_REACH - 0.9} ${top + 2} Z`} fill={brawlNight.post} />
          <ellipse cx={x + ARM_REACH} cy={top + 2.1} rx={0.9} ry={0.45} fill={brawlNight.lamp} />
        </g>
      );
    })}
  </g>
);
