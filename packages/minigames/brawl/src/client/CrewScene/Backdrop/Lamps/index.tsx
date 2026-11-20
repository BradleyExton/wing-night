import { brawlNight } from "../../palette.js";

/** How tall a lamp post stands, and how far its arm reaches out over the street. */
const POST_HEIGHT = 34;
const ARM_REACH = 6;

/**
 * The street lamps along the back of the band: a dark post, an arm out over the street, a hot
 * head and a soft pool of light on the ground under it (`poolY`). They are what makes the street
 * read as night rather than as a dim day — and they stand behind the fight, never in it.
 */
export const Lamps = ({ xs, baseY, poolY }: { xs: readonly number[]; baseY: number; poolY: number }): JSX.Element => (
  <g data-brawl-lamps aria-hidden="true">
    {xs.map((x) => {
      const top = baseY - POST_HEIGHT;

      return (
        <g key={x}>
          <ellipse cx={x + ARM_REACH} cy={poolY} rx={22} ry={7} fill={brawlNight.lampGlow} />
          <ellipse cx={x + ARM_REACH} cy={poolY} rx={12} ry={3.6} fill={brawlNight.lampGlow} />
          <circle cx={x + ARM_REACH} cy={top + 2} r={7} fill={brawlNight.lampGlow} />
          <circle cx={x + ARM_REACH} cy={top + 2} r={3.6} fill={brawlNight.lampGlow} />
          <rect x={x - 0.6} y={top} width={1.2} height={POST_HEIGHT} fill={brawlNight.post} />
          <rect x={x - 1.3} y={baseY - 1.4} width={2.6} height={1.4} fill={brawlNight.post} />
          <path d={`M ${x} ${top + 0.6} Q ${x + ARM_REACH / 2} ${top - 1.6} ${x + ARM_REACH} ${top + 0.6}`} fill="none" stroke={brawlNight.post} strokeWidth={0.8} />
          <path d={`M ${x + ARM_REACH - 1.8} ${top + 0.6} L ${x + ARM_REACH + 1.8} ${top + 0.6} L ${x + ARM_REACH + 1} ${top + 2.2} L ${x + ARM_REACH - 1} ${top + 2.2} Z`} fill={brawlNight.post} />
          <ellipse cx={x + ARM_REACH} cy={top + 2.3} rx={1} ry={0.5} fill={brawlNight.lamp} />
        </g>
      );
    })}
  </g>
);
