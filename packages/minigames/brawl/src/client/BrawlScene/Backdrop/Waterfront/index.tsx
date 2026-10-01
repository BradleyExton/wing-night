import { WaterfrontCondos } from "@wingnight/scenery";
import type { BrawlBlock } from "@wingnight/shared";

import { NIGHT_TOWN, brawlNight } from "../../palette.js";
import { Lamps } from "../Lamps/index.js";
import { STREET_BANDS, resolveGlints, resolveStops, resolveStreetExtent } from "../layout/index.js";

const CONDO_SCALE = 0.8;
const PLANK = 7;
const RAIL_POST = 12;

/**
 * Block two: the waterfront. Kempenfelt Bay at night behind a boardwalk railing, the lamps'
 * glints broken across it, and the twin condos standing on the shore — the same towers SCHLONIC
 * and JOUST stand, in the dark. The fight is on the boardwalk's planks.
 */
export const Waterfront = ({ block }: { block: BrawlBlock }): JSX.Element => {
  const extent = resolveStreetExtent(block);
  const { horizonY, waterfrontShoreY, railTop, boardwalkTop, bottom } = STREET_BANDS;
  const width = extent.right - extent.left;

  return (
    <g data-brawl-setting="waterfront" aria-hidden="true">
      <rect x={extent.left} y={horizonY} width={width} height={waterfrontShoreY - horizonY} fill={brawlNight.water} />
      {resolveGlints(extent, horizonY, waterfrontShoreY - 1).map((glint) => (
        <rect key={glint.x} x={glint.x} y={glint.y} width={glint.width} height={0.35} fill={brawlNight.glint} />
      ))}
      {resolveStops(extent, 260, 70).map((x) => (
        <WaterfrontCondos key={x} x={x} baseY={waterfrontShoreY + 1} palette={NIGHT_TOWN} scale={CONDO_SCALE} />
      ))}
      <rect x={extent.left} y={waterfrontShoreY} width={width} height={boardwalkTop - waterfrontShoreY} fill={brawlNight.wallDark} />
      <rect x={extent.left} y={boardwalkTop} width={width} height={bottom - boardwalkTop} fill={brawlNight.plank} />
      {resolveStops(extent, PLANK).map((x) => (
        <rect key={x} x={x} y={boardwalkTop} width={0.3} height={bottom - boardwalkTop} fill={brawlNight.road} />
      ))}
      <rect x={extent.left} y={boardwalkTop} width={width} height={0.8} fill={brawlNight.kerb} opacity={0.5} />
      <Lamps xs={resolveStops(extent, 120, 50)} baseY={boardwalkTop + 1} />
      <g fill={brawlNight.trim}>
        {resolveStops(extent, RAIL_POST).map((x) => (
          <rect key={x} x={x} y={railTop} width={0.8} height={boardwalkTop - railTop} />
        ))}
        <rect x={extent.left} y={railTop} width={width} height={0.8} />
        <rect x={extent.left} y={railTop + 3.2} width={width} height={0.5} />
      </g>
    </g>
  );
};
