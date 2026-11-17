import { QUEENS_HOTEL, QueensHotel, SOULDIERS_SKATE_SHOP, STOREFRONTS, SouldiersSkateShop, Storefronts } from "@wingnight/scenery";
import type { BrawlCrewBlock } from "@wingnight/shared";

import { NIGHT_QUEENS, NIGHT_SOULDIERS, NIGHT_STOREFRONTS, brawlNight } from "../../palette.js";
import { Lamps } from "../Lamps/index.js";
import { STREET_BANDS, resolveStops, resolveStreetExtent } from "../layout/index.js";

/** The fronts across the road, a third bigger than they are drawn: the far side of a wide window. */
const FRONT_SCALE = 1.35;
/** Souldiers sits just behind the start line; the Queen's patio is a step past the way out. */
const SOULDIERS_X = 2;
const QUEENS_PAST_EXIT = 10;
const LANE_DASH = 7;
/** A manhole every so often, alternating across the road: something on the tarmac to read depth off. */
const MANHOLE_STEP = 132;

/** A run of fronts from `from` to `to`, seeded so neighbouring runs do not repeat each other. */
const FrontRun = ({ from, to, seed }: { from: number; to: number; seed: number }): JSX.Element | null => {
  const width = STOREFRONTS.frontWidth * FRONT_SCALE;
  const count = Math.floor((to - from) / width);

  return count <= 0 ? null : (
    <Storefronts x={from} baseY={STREET_BANDS.farKerbY} palette={NIGHT_STOREFRONTS} seed={seed} count={count} scale={FRONT_SCALE} />
  );
};

/**
 * Block one: Dunlop Street at night, and the crew is in the road. Souldiers stands behind the
 * start line, a row of downtown fronts runs the length of the block across the far sidewalk, and
 * the Queen's waits at the way out with its patio lit — Dunlop's own start and finish, as Dunlop
 * Dash has them, at the far end of a night out. The walkable band is the tarmac between the two
 * kerbs, the yellow line down its middle.
 */
export const Dunlop = ({ block }: { block: BrawlCrewBlock }): JSX.Element => {
  const extent = resolveStreetExtent(block);
  const souldiersRight = SOULDIERS_X + SOULDIERS_SKATE_SHOP.width * FRONT_SCALE;
  const queensX = block.exitX + QUEENS_PAST_EXIT - QUEENS_HOTEL.barX * FRONT_SCALE;
  const queensRight = queensX + QUEENS_HOTEL.width * FRONT_SCALE;
  const { roadTop, roadBottom, laneY, kerbBottom, bottom, farKerbY } = STREET_BANDS;
  const width = extent.right - extent.left;

  return (
    <g data-brawl-setting="dunlop" aria-hidden="true">
      <FrontRun from={extent.left} to={SOULDIERS_X} seed={3} />
      <SouldiersSkateShop x={SOULDIERS_X} baseY={farKerbY} palette={NIGHT_SOULDIERS} scale={FRONT_SCALE} />
      <FrontRun from={souldiersRight} to={queensX} seed={11} />
      <QueensHotel x={queensX} baseY={farKerbY} palette={NIGHT_QUEENS} scale={FRONT_SCALE} />
      <FrontRun from={queensRight} to={extent.right} seed={19} />
      <rect x={extent.left} y={farKerbY} width={width} height={roadTop - farKerbY} fill={brawlNight.sidewalk} opacity={0.7} />
      <rect x={extent.left} y={roadTop - 1.1} width={width} height={1.1} fill={brawlNight.kerb} />
      <rect x={extent.left} y={roadTop} width={width} height={roadBottom - roadTop} fill={brawlNight.road} />
      {resolveStops(extent, LANE_DASH * 2).map((x) => (
        <rect key={x} x={x} y={laneY - 0.4} width={LANE_DASH} height={0.8} fill={brawlNight.lane} />
      ))}
      {resolveStops(extent, MANHOLE_STEP, 58).map((x, index) => (
        <g key={x}>
          <ellipse cx={x} cy={index % 2 === 0 ? 76 : 96} rx={4.2} ry={1.5} fill={brawlNight.joint} />
          <ellipse cx={x} cy={index % 2 === 0 ? 76 : 96} rx={3.2} ry={1} fill="none" stroke={brawlNight.kerb} strokeWidth={0.3} opacity={0.5} />
        </g>
      ))}
      <rect x={extent.left} y={roadBottom} width={width} height={kerbBottom - roadBottom} fill={brawlNight.kerb} />
      <rect x={extent.left} y={kerbBottom} width={width} height={bottom - kerbBottom} fill={brawlNight.sidewalk} opacity={0.72} />
      <Lamps xs={resolveStops(extent, 96, 40)} baseY={roadTop - 1.4} poolY={roadTop + 7} />
    </g>
  );
};
