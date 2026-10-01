import { SpiritCatcher } from "@wingnight/scenery";
import type { BrawlBlock } from "@wingnight/shared";

import { NIGHT_TOWN, brawlNight } from "../../palette.js";
import { STREET_BANDS, resolveGlints, resolveStops, resolveStreetExtent } from "../layout/index.js";

/** The Spirit Catcher stands just past the handoff, so the last block ends under its wings. */
const CATCHER_PAST_HANDOFF = 16;
const CATCHER_HALF_SPAN = 16;
const RIPPLE = 22;

/**
 * Block three and on: Centennial Beach at night, the bay wide behind the sand and the Spirit
 * Catcher at the end of it — the thunderbird the city put on this shore decades before this game
 * put a hen on it. The fight is on the sand.
 */
export const Beach = ({ block }: { block: BrawlBlock }): JSX.Element => {
  const extent = resolveStreetExtent(block);
  const { horizonY, beachShoreY, bottom } = STREET_BANDS;
  const width = extent.right - extent.left;

  return (
    <g data-brawl-setting="beach" aria-hidden="true">
      <rect x={extent.left} y={horizonY} width={width} height={beachShoreY - horizonY} fill={brawlNight.water} />
      {resolveGlints(extent, horizonY, beachShoreY - 1).map((glint) => (
        <rect key={glint.x} x={glint.x} y={glint.y} width={glint.width} height={0.35} fill={brawlNight.glint} />
      ))}
      <g data-brawl-spirit-catcher>
        <SpiritCatcher
          x={block.handoffX + CATCHER_PAST_HANDOFF}
          baseY={beachShoreY + 1}
          halfSpan={CATCHER_HALF_SPAN}
          palette={NIGHT_TOWN}
        />
      </g>
      <rect x={extent.left} y={beachShoreY} width={width} height={bottom - beachShoreY} fill={brawlNight.sand} />
      <rect x={extent.left} y={beachShoreY} width={width} height={0.5} fill={brawlNight.glint} />
      {resolveStops(extent, RIPPLE, 5).map((x, index) => (
        <path
          key={x}
          d={`M ${x} ${64 + (index % 3) * 9} q 3 -1.2 6 0`}
          fill="none"
          stroke={brawlNight.joint}
          strokeWidth={0.5}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};
