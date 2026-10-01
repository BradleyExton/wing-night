import { forwardRef } from "react";
import { TownCluster } from "@wingnight/scenery";

import { NIGHT_TOWN, brawlNight } from "../../palette.js";
import { STREET_BANDS, type BrawlSetting } from "../layout/index.js";

/** Fixed little stars across the sky bank, in its own units. */
const STARS = [
  [-40, 6], [-18, 14], [4, 4], [22, 11], [40, 3], [58, 16], [76, 7], [96, 12], [112, 4], [148, 9],
  [166, 17], [184, 5], [204, 13], [226, 6], [248, 15], [270, 4], [292, 10], [318, 7], [340, 14], [366, 5]
] as const;
const MOON = { x: 132, y: 13, r: 4.6 };
/** Oro's far shore across the bay: a low treeline with a few porch lights on it. */
const SHORE_LIGHTS = [-30, 12, 46, 88, 130, 170, 214, 262, 300, 346];

const farShorePath = (): string => {
  const { horizonY } = STREET_BANDS;
  const points = Array.from({ length: 26 }, (_, index) => {
    const x = -80 + index * 20;
    const y = horizonY - 1.4 - ((index * 7) % 5) * 0.5;

    return `L ${x} ${y}`;
  });

  return `M -80 ${horizonY} ${points.join(" ")} L 440 ${horizonY} Z`;
};

/**
 * The night over the street: a moon, a few stars and the far edge of the world — downtown's
 * slabs over Dunlop's roofs, or Oro's shore across the bay — on a bank the scene slides at a
 * small share of the camera (`paintBackdrop`), so the room reads distance off it.
 */
export const Sky = forwardRef<SVGGElement, { setting: BrawlSetting }>(({ setting }, ref): JSX.Element => (
  <g ref={ref} data-brawl-sky aria-hidden="true">
    {STARS.map(([x, y]) => (
      <circle key={x} cx={x} cy={y} r={0.35} fill={brawlNight.star} />
    ))}
    <circle cx={MOON.x} cy={MOON.y} r={MOON.r * 1.6} fill={brawlNight.lampGlow} />
    <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill={brawlNight.moon} />
    <circle cx={MOON.x + 1.6} cy={MOON.y - 0.9} r={MOON.r * 0.85} fill={brawlNight.townDark} opacity={0.25} />
    {setting === "dunlop" ? (
      [-60, 4, 70, 136, 204, 270, 336].map((x) => (
        <TownCluster key={x} x={x} baseY={STREET_BANDS.farKerbY - 6} palette={NIGHT_TOWN} />
      ))
    ) : (
      <g>
        <path d={farShorePath()} fill={brawlNight.town} />
        {SHORE_LIGHTS.map((x) => (
          <circle key={x} cx={x} cy={STREET_BANDS.horizonY - 0.8} r={0.3} fill={brawlNight.pane} />
        ))}
      </g>
    )}
  </g>
));

Sky.displayName = "Sky";
