import { QUEENS_HOTEL, QueensHotel, SOULDIERS_SKATE_SHOP, STOREFRONTS, SouldiersSkateShop, Storefronts } from "@wingnight/scenery";
import type { BrawlBlock } from "@wingnight/shared";

import { NIGHT_QUEENS, NIGHT_SOULDIERS, NIGHT_STOREFRONTS, brawlNight } from "../../palette.js";
import { Lamps } from "../Lamps/index.js";
import { STREET_BANDS, resolveStops, resolveStreetExtent } from "../layout/index.js";

/** The fronts across the road stand at this share of their drawing: far side of the street. */
const FRONT_SCALE = 0.8;
/** Souldiers sits just behind the start line; the Queen's patio is a step past the handoff. */
const SOULDIERS_X = 2;
const QUEENS_PAST_HANDOFF = 10;
const SLAB = 16;
const LANE_DASH = 6;

/** A run of fronts from `from` to `to`, seeded so neighbouring runs do not repeat each other. */
const FrontRun = ({ from, to, seed }: { from: number; to: number; seed: number }): JSX.Element | null => {
  const width = STOREFRONTS.frontWidth * FRONT_SCALE;
  const count = Math.floor((to - from) / width);

  return count <= 0 ? null : (
    <Storefronts x={from} baseY={STREET_BANDS.farKerbY} palette={NIGHT_STOREFRONTS} seed={seed} count={count} scale={FRONT_SCALE} />
  );
};

/**
 * Block one: Dunlop Street at night, seen from the near sidewalk. Souldiers stands behind the
 * start line, a row of downtown fronts runs the length of the block across the road, and the
 * Queen's waits at the handoff with its patio lit — Dunlop's own start and finish, as SCHLONIC
 * has them, at the far end of a night out.
 */
export const Dunlop = ({ block }: { block: BrawlBlock }): JSX.Element => {
  const extent = resolveStreetExtent(block);
  const souldiersRight = SOULDIERS_X + SOULDIERS_SKATE_SHOP.width * FRONT_SCALE;
  const queensX = block.handoffX + QUEENS_PAST_HANDOFF - QUEENS_HOTEL.barX * FRONT_SCALE;
  const queensRight = queensX + QUEENS_HOTEL.width * FRONT_SCALE;
  const { roadTop, roadBottom, laneY, kerbBottom, bottom, farKerbY } = STREET_BANDS;

  return (
    <g data-brawl-setting="dunlop" aria-hidden="true">
      <FrontRun from={extent.left} to={SOULDIERS_X} seed={3} />
      <SouldiersSkateShop x={SOULDIERS_X} baseY={farKerbY} palette={NIGHT_SOULDIERS} scale={FRONT_SCALE} />
      <FrontRun from={souldiersRight} to={queensX} seed={11} />
      <QueensHotel x={queensX} baseY={farKerbY} palette={NIGHT_QUEENS} scale={FRONT_SCALE} />
      <FrontRun from={queensRight} to={extent.right} seed={19} />
      <rect x={extent.left} y={farKerbY} width={extent.right - extent.left} height={roadTop - farKerbY} fill={brawlNight.sidewalk} opacity={0.6} />
      <rect x={extent.left} y={roadTop} width={extent.right - extent.left} height={roadBottom - roadTop} fill={brawlNight.road} />
      {resolveStops(extent, LANE_DASH * 2).map((x) => (
        <rect key={x} x={x} y={laneY} width={LANE_DASH} height={0.6} fill={brawlNight.lane} />
      ))}
      <rect x={extent.left} y={roadBottom} width={extent.right - extent.left} height={kerbBottom - roadBottom} fill={brawlNight.kerb} />
      <rect x={extent.left} y={kerbBottom} width={extent.right - extent.left} height={bottom - kerbBottom} fill={brawlNight.sidewalk} opacity={0.72} />
      {resolveStops(extent, SLAB).map((x) => (
        <rect key={x} x={x} y={kerbBottom} width={0.35} height={bottom - kerbBottom} fill={brawlNight.joint} />
      ))}
      <rect x={extent.left} y={78} width={extent.right - extent.left} height={0.35} fill={brawlNight.joint} />
      <Lamps xs={resolveStops(extent, 96, 40)} baseY={kerbBottom + 1.5} />
    </g>
  );
};
