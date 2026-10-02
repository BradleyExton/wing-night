import { memo } from "react";
import type { BrawlBlock } from "@wingnight/shared";

import { Hazard } from "../Hazards/index.js";
import { Beach } from "./Beach/index.js";
import { Dunlop } from "./Dunlop/index.js";
import { HandoffLine } from "./HandoffLine/index.js";
import { resolveBrawlSetting } from "./layout/index.js";
import { Waterfront } from "./Waterfront/index.js";

export { Sky } from "./Sky/index.js";
export { resolveBrawlSetting, type BrawlSetting } from "./layout/index.js";

/** How far the sky bank slides for every unit the camera moves: the far edge of the world. */
export const SKY_PARALLAX = 0.12;

/** Slides the sky bank by its share of the camera: the parallax, per frame. */
export const paintSky = (element: SVGGElement | null, cameraX: number): void => {
  element?.setAttribute("transform", `translate(${Math.round(-cameraX * SKY_PARALLAX * 100) / 100} 0)`);
};

/**
 * The block's own stretch of Barrie, in world units, scrolled with the fight: the buildings or the
 * water behind, the ground the hen and the goons stand on, the lamps, the block's hazard (the
 * railing, the bay's edge or the plinth, `../Hazards`), and the chalk line at the handoff. Memoised on the block, so a block's street is built once and only ever moved.
 */
export const Street = memo(({ block }: { block: BrawlBlock }): JSX.Element => {
  const setting = resolveBrawlSetting(block.index);

  return (
    <g data-brawl-street={setting}>
      {setting === "dunlop" && <Dunlop block={block} />}
      {setting === "waterfront" && <Waterfront block={block} />}
      {setting === "beach" && <Beach block={block} />}
      {block.hazard !== null && <Hazard hazard={block.hazard} />}
      <HandoffLine x={block.handoffX} />
    </g>
  );
});

Street.displayName = "Street";
