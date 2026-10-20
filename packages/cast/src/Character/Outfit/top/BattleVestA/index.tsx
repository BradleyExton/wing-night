import { useId } from "react";

import { COSTUME_HEAD_ANCHORS } from "../../../geometry/index.js";
import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// battle-vest a (metal Top), ported from the harness's metal-kit.js: the ink
// cut-off with one fat lightning-bolt patch cut into it, the team colour
// showing through. The vest is the chest that shows right of the wing's
// front edge, from the shoulders down, clipped to the body so it can never
// leave the outline (and so never JOUST's chest pin or MOUNT's body ball).
//
// The two panels are the harness's own `chestPanel(head.shoulders)`, computed
// there and written out here: the front edge is the wing's front curve pushed
// 0.8 forward, sampled at tenths, so the vest clears the wing's ink line.
const PANEL_UNDER_DRAWN_HEAD =
  "M 47.8 32 L 72 32 L 72 66 L 43.6 66 L 44.4 56 L 45.8 51 L 46.94 49.47 L 47.93 47.9 L 48.75 46.28 L 49.38 44.65 L 49.8 43 L 49.98 41.35 L 49.89 39.72 L 49.51 38.1 L 48.82 36.53 L 47.8 35 L 47.8 32 Z";

const PANEL_UNDER_COSTUME_HEAD =
  "M 49.03 37 L 72 37 L 72 66 L 43.6 66 L 44.4 56 L 45.8 51 L 46.94 49.47 L 47.93 47.9 L 48.75 46.28 L 49.38 44.65 L 49.8 43 L 49.98 41.35 L 49.89 39.72 L 49.51 38.1 L 49.03 37 Z";

// 18 tall and 12 wide, the most metal 13-unit shape that is not a face.
const BOLT = "M 56 39.4 L 62.2 39.4 L 58.8 45.4 L 62.8 45.4 L 51.4 57.8 L 54.4 49.6 L 50.4 49.6 Z";

export const BattleVestA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const panel = context.head.shoulders >= COSTUME_HEAD_ANCHORS.shoulders ? PANEL_UNDER_COSTUME_HEAD : PANEL_UNDER_DRAWN_HEAD;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.styleFill[context.style ?? "ink"]} d={panel} />
        <path className={styles.teamFill} d={BOLT} />
      </g>
    </g>
  );
};
