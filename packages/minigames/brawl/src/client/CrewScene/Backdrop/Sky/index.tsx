import { memo } from "react";
import { TownCluster } from "@wingnight/scenery";

import { NIGHT_TOWN, brawlNight } from "../../palette.js";
import { STREET_BANDS, type BrawlSetting } from "../layout/index.js";

/**
 * Fixed little stars across the sky bank, in its own units. They sit below the top fifth of the
 * window, because the wall's wide arena gives up sky from the top (`fit="cover"`).
 */
const STARS = [
  [-52, 26], [-30, 19], [-8, 31], [14, 22], [36, 28], [58, 20], [80, 33], [102, 24], [124, 30], [170, 21],
  [192, 32], [214, 23], [238, 29], [262, 20], [286, 31], [310, 24], [334, 28], [360, 21], [384, 32], [410, 25]
] as const;
const MOON = { x: 148, y: 27, r: 5.2 };
/** Oro's far shore across the bay: a low treeline with a few porch lights on it. */
const SHORE_LIGHTS = [-30, 12, 46, 88, 130, 170, 214, 262, 300, 346, 392, 436];

const farShorePath = (): string => {
  const { horizonY } = STREET_BANDS;
  const points = Array.from({ length: 31 }, (_, index) => {
    const x = -100 + index * 20;
    const y = horizonY - 1.6 - ((index * 7) % 5) * 0.55;

    return `L ${x} ${y}`;
  });

  return `M -100 ${horizonY} ${points.join(" ")} L 500 ${horizonY} Z`;
};

/**
 * The night over the street: a moon, a few stars and the far edge of the world — downtown's
 * slabs over Dunlop's roofs, or Oro's shore across the bay — on a bank the scene slides at a
 * small share of the camera (`SKY_PARALLAX`), so the room reads distance off it. Drawn once.
 */
export const Sky = memo(({ setting }: { setting: BrawlSetting }): JSX.Element => (
  <g data-brawl-sky aria-hidden="true">
    {STARS.map(([x, y]) => (
      <circle key={x} cx={x} cy={y} r={0.4} fill={brawlNight.star} />
    ))}
    <circle cx={MOON.x} cy={MOON.y} r={MOON.r * 1.6} fill={brawlNight.lampGlow} />
    <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill={brawlNight.moon} />
    <circle cx={MOON.x + 1.8} cy={MOON.y - 1} r={MOON.r * 0.85} fill={brawlNight.townDark} opacity={0.25} />
    {setting === "dunlop" ? (
      [-72, 0, 74, 146, 220, 292, 366, 438].map((x) => (
        <g key={x} transform={`translate(${x} ${STREET_BANDS.farKerbY - 12}) scale(1.3)`}>
          <TownCluster x={0} baseY={0} palette={NIGHT_TOWN} />
        </g>
      ))
    ) : (
      <g>
        <path d={farShorePath()} fill={brawlNight.town} />
        {SHORE_LIGHTS.map((x) => (
          <circle key={x} cx={x} cy={STREET_BANDS.horizonY - 0.9} r={0.35} fill={brawlNight.pane} />
        ))}
      </g>
    )}
  </g>
));

Sky.displayName = "Sky";
