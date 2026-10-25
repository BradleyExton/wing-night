import type { OutfitItemProps } from "../../context/index.js";
import { BOW, isOnPlume, PLUME_TOP_TIP_SHIFT } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// big-bow b (pop Tail), ported from the harness's pop-kit.js: the ponytail
// bow, perched on the top feather's tip and tied square across it, its loops
// standing out past the fan the way Baby's bunches wore theirs. Inked only
// round its outside (the harness's `silhouette`).
//
// Placed on the stock fan tail's top tip, (11, 10), by a literal transform,
// and on the plume's upper tip for a bird whose tail is the plume.
export const BigBowB = ({ context }: OutfitItemProps): JSX.Element => {
  const fill = styles.styleFill[context.style ?? "white"];

  return (
    <g transform={`${isOnPlume(context.shapes.tail) ? `${PLUME_TOP_TIP_SHIFT} ` : ""}translate(11.5 13) rotate(-28)`}>
      <path className={`${fill} ${styles.bowEdge}`} d={BOW} />
      <path className={fill} d={BOW} />
    </g>
  );
};
