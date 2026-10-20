import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// led-star-riser a (pop Stage), ported from the harness's pop-show.js: a
// podium, a tall team-pink drum side under a lit top the feet stand on, and
// one big star (r 8.6) on the drum's front right, under the breast where no
// foot covers it, breaking the top edge. The top is a thin lens, so the side
// and not the top carries the outline. A showpiece, never drawn in a game.
//
// The side is the harness's template, sum and all: 68.4 + 8.4 is the float
// it wrote. The star is its `star(58, 72.2, 8.6)`, written out.
const SIDE_BOTTOM = 68.4 + 8.4;

const SIDE = `M 8 68.4 L 8 ${SIDE_BOTTOM} A 30 2.6 0 0 0 68 ${SIDE_BOTTOM} L 68 68.4 Z`;

const STAR = "M 58 63.6 L 60.53 68.72 L 66.18 69.54 L 62.09 73.53 L 63.05 79.16 L 58 76.5 L 52.95 79.16 L 53.91 73.53 L 49.82 69.54 L 55.47 68.72 Z";

export const LedStarRiserA = ({ context }: OutfitItemProps): JSX.Element => {
  const lit = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={`${styles.teamFill} ${styles.inkEdge}`} d={SIDE} />
      <ellipse className={`${lit} ${styles.topEdge}`} cx={38} cy={68.4} rx={30} ry={2.6} />
      <path className={`${lit} ${styles.inkEdge}`} d={STAR} />
    </g>
  );
};
