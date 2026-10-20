import type { OutfitItemProps } from "../../context/index.js";
import { BOW } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// big-bow a (pop Tail), ported from the harness's pop-kit.js: Baby's big bow,
// 17 across, tied across the middle of the fan with its loops left and right
// and its ribbon ends hanging down the tail, inked only round its outside
// (the harness's `silhouette`: the edge drawn first, the fill again on top).
//
// Placed on the stock fan tail's middle by a literal transform.
export const BigBowA = ({ context }: OutfitItemProps): JSX.Element => {
  const fill = styles.styleFill[context.style ?? "white"];

  return (
    <g transform="translate(9 26) rotate(-18)">
      <path className={`${fill} ${styles.bowEdge}`} d={BOW} />
      <path className={fill} d={BOW} />
    </g>
  );
};
