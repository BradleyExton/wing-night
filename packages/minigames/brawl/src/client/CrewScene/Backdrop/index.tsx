import { memo } from "react";
import type { BrawlCrewBlock } from "@wingnight/shared";

import { Hazard } from "../Hazards/index.js";
import { Beach } from "./Beach/index.js";
import { Dunlop } from "./Dunlop/index.js";
import { ExitLine } from "./ExitLine/index.js";
import { resolveBrawlSetting } from "./layout/index.js";
import { Waterfront } from "./Waterfront/index.js";

export { Sky } from "./Sky/index.js";
export { STREET_BANDS, resolveBrawlSetting, resolveGroundY, resolveStreetExtent, type BrawlSetting } from "./layout/index.js";

/** How far the sky bank slides for every unit the camera moves: the far edge of the world. */
export const SKY_PARALLAX = 0.12;

/** How far the sky bank is drawn either side: past both edges of the window at any camera. */
export const SKY_EXTENT = { left: -100, right: 500 } as const;

/**
 * The block's own stretch of Barrie, in world units, scrolled with the fight: the buildings or the
 * water behind, the band the crew and the goons stand on, the lamps, the block's hazard (the
 * patio railing, the bay's edge or the plinth, `../Hazards`), and the chalk line at the way out.
 * Memoised on the block, so a block's street is built once and only ever moved.
 */
export const Street = memo(({ block }: { block: BrawlCrewBlock }): JSX.Element => {
  const setting = resolveBrawlSetting(block.index);

  return (
    <g data-brawl-street={setting}>
      {setting === "dunlop" && <Dunlop block={block} />}
      {setting === "waterfront" && <Waterfront block={block} />}
      {setting === "beach" && <Beach block={block} />}
      {block.hazard !== null && <Hazard hazard={block.hazard} />}
      <ExitLine x={block.exitX} />
    </g>
  );
});

Street.displayName = "Street";
