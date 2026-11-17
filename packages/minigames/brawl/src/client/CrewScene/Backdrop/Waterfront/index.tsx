import { WaterfrontCondos } from "@wingnight/scenery";
import type { BrawlCrewBlock } from "@wingnight/shared";

import { NIGHT_TOWN, brawlNight } from "../../palette.js";
import { Lamps } from "../Lamps/index.js";
import { STREET_BANDS, resolveGlints, resolveStops, resolveStreetExtent } from "../layout/index.js";

const PLANK = 8;
const RAIL_POST = 12;
/** The boards' butt joints, staggered row to row down the walk: the planks' own depth cue. */
const BOARD_ROWS = [74, 84, 94, 104];

/**
 * Block two: the waterfront. Kempenfelt Bay at night behind a boardwalk railing, the lamps'
 * glints broken across it, and the twin condos standing on the shore — the same towers Dunlop
 * Dash and Slingshlong stand, in the dark. The walkable band is the boardwalk's planks, from the
 * railing at its back to the bottom of the window.
 */
export const Waterfront = ({ block }: { block: BrawlCrewBlock }): JSX.Element => {
  const extent = resolveStreetExtent(block);
  const { horizonY, waterfrontShoreY, railTop, boardwalkTop, bottom } = STREET_BANDS;
  const width = extent.right - extent.left;

  return (
    <g data-brawl-setting="waterfront" aria-hidden="true">
      <rect x={extent.left} y={horizonY} width={width} height={waterfrontShoreY - horizonY} fill={brawlNight.water} />
      {resolveGlints(extent, horizonY, waterfrontShoreY - 1).map((glint) => (
        <rect key={glint.x} x={glint.x} y={glint.y} width={glint.width} height={0.4} fill={brawlNight.glint} />
      ))}
      {resolveStops(extent, 300, 84).map((x) => (
        <WaterfrontCondos key={x} x={x} baseY={waterfrontShoreY + 1} palette={NIGHT_TOWN} />
      ))}
      <rect x={extent.left} y={waterfrontShoreY} width={width} height={boardwalkTop - waterfrontShoreY} fill={brawlNight.wallDark} />
      <rect x={extent.left} y={boardwalkTop} width={width} height={bottom - boardwalkTop} fill={brawlNight.plank} />
      {resolveStops(extent, PLANK).map((x) => (
        <rect key={x} x={x} y={boardwalkTop} width={0.35} height={bottom - boardwalkTop} fill={brawlNight.road} />
      ))}
      {BOARD_ROWS.map((y, row) =>
        resolveStops(extent, PLANK * 3, row * PLANK).map((x) => (
          <rect key={`${y}:${x}`} x={x} y={y} width={PLANK} height={0.35} fill={brawlNight.road} />
        ))
      )}
      <rect x={extent.left} y={boardwalkTop} width={width} height={0.9} fill={brawlNight.kerb} opacity={0.5} />
      <Lamps xs={resolveStops(extent, 120, 50)} baseY={boardwalkTop + 1} poolY={boardwalkTop + 8} />
      <g fill={brawlNight.trim}>
        {resolveStops(extent, RAIL_POST).map((x) => (
          <rect key={x} x={x} y={railTop} width={0.9} height={boardwalkTop - railTop} />
        ))}
        <rect x={extent.left} y={railTop} width={width} height={0.9} />
        <rect x={extent.left} y={railTop + 3.6} width={width} height={0.5} />
      </g>
    </g>
  );
};
