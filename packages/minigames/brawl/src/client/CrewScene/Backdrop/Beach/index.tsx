import { SpiritCatcher } from "@wingnight/scenery";
import type { BrawlCrewBlock } from "@wingnight/shared";

import { NIGHT_TOWN, brawlNight } from "../../palette.js";
import { STREET_BANDS, resolveGlints, resolveStops, resolveStreetExtent } from "../layout/index.js";

/** The Spirit Catcher stands just past the way out, so the last block ends under its wings. */
const CATCHER_PAST_EXIT = 20;
const CATCHER_HALF_SPAN = 21;
const RIPPLE = 26;
/** The sand's ripples sit on four lines down the band, so the beach has a back and a front. */
const RIPPLE_ROWS = [69, 79, 90, 101];

/**
 * Block three and on: Centennial Beach at night, the bay wide behind the sand and the Spirit
 * Catcher at the end of it — the thunderbird the city put on this shore decades before this game
 * put a hen on it. The walkable band is the sand, from the waterline to the bottom of the window.
 */
export const Beach = ({ block }: { block: BrawlCrewBlock }): JSX.Element => {
  const extent = resolveStreetExtent(block);
  const { horizonY, beachShoreY, bottom } = STREET_BANDS;
  const width = extent.right - extent.left;

  return (
    <g data-brawl-setting="beach" aria-hidden="true">
      <rect x={extent.left} y={horizonY} width={width} height={beachShoreY - horizonY} fill={brawlNight.water} />
      {resolveGlints(extent, horizonY, beachShoreY - 1).map((glint) => (
        <rect key={glint.x} x={glint.x} y={glint.y} width={glint.width} height={0.4} fill={brawlNight.glint} />
      ))}
      <g data-brawl-spirit-catcher>
        <SpiritCatcher x={block.exitX + CATCHER_PAST_EXIT} baseY={beachShoreY + 1.5} halfSpan={CATCHER_HALF_SPAN} palette={NIGHT_TOWN} />
      </g>
      <rect x={extent.left} y={beachShoreY} width={width} height={bottom - beachShoreY} fill={brawlNight.sand} />
      <rect x={extent.left} y={beachShoreY} width={width} height={0.6} fill={brawlNight.glint} />
      <rect x={extent.left} y={beachShoreY + 0.6} width={width} height={2.4} fill={brawlNight.water} opacity={0.35} />
      {RIPPLE_ROWS.map((y, row) =>
        resolveStops(extent, RIPPLE, row * 9).map((x) => (
          <path key={`${y}:${x}`} d={`M ${x} ${y} q 3.5 -1.3 7 0`} fill="none" stroke={brawlNight.joint} strokeWidth={0.5} strokeLinecap="round" />
        ))
      )}
    </g>
  );
};
