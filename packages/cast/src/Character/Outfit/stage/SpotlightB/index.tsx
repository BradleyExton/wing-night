import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// spotlight b (pop Stage), ported from the harness's pop-show.js: a star
// gobo, a soft pool with four crisp four-point glints off the feet, a big
// pair at the ends and an inner pair, full strength with a rim of ink so they
// hold on the light. No glint under the feet. Sparkle where a is plain glow.
//
// The pool is the harness's `softPool` (a little dimmer than a's); the glints
// its four `star(x, y, r, { points: 4, inner: 0.28, sy: 0.8 })`, written out.
const GLINTS = "M 2 63.2 L 3.19 67.05 L 8 68 L 3.19 68.95 L 2 72.8 L 0.81 68.95 L -4 68 L 0.81 67.05 Z M 13 70.34 L 14.03 73.68 L 18.2 74.5 L 14.03 75.32 L 13 78.66 L 11.97 75.32 L 7.8 74.5 L 11.97 73.68 Z M 63 70.34 L 64.03 73.68 L 68.2 74.5 L 64.03 75.32 L 63 78.66 L 61.97 75.32 L 57.8 74.5 L 61.97 73.68 Z M 74 63.2 L 75.19 67.05 L 80 68 L 75.19 68.95 L 74 72.8 L 72.81 68.95 L 68 68 L 72.81 67.05 Z";

export const SpotlightB = ({ context }: OutfitItemProps): JSX.Element => {
  const gradientId = useId();
  const style = context.style ?? "white";
  const light = styles.stopColor[style];

  return (
    <g>
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0" className={`${light} ${styles.peak}`} />
          <stop offset="0.55" className={`${light} ${styles.mid}`} />
          <stop offset="1" className={`${light} ${styles.fade}`} />
        </radialGradient>
      </defs>
      <ellipse fill={`url(#${gradientId})`} cx={38} cy={71.4} rx={36} ry={6.6} />
      <path className={`${styles.styleFill[style]} ${styles.glintEdge}`} d={GLINTS} />
    </g>
  );
};
