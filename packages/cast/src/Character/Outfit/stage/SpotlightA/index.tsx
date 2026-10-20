import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// spotlight a (pop Stage), ported from the harness's pop-show.js: a soft pool
// of light on the floor, a wide radial glow under the feet, brightest in the
// middle and gone at the edge. Never a cone from above (it would cross the
// face), and never a hard ellipse (a dinner plate). The harness's `softPool`.
export const SpotlightA = ({ context }: OutfitItemProps): JSX.Element => {
  const gradientId = useId();
  const light = styles.stopColor[context.style ?? "white"];

  return (
    <g>
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0" className={`${light} ${styles.peak}`} />
          <stop offset="0.55" className={`${light} ${styles.mid}`} />
          <stop offset="1" className={`${light} ${styles.fade}`} />
        </radialGradient>
      </defs>
      <ellipse fill={`url(#${gradientId})`} cx={38} cy={71.4} rx={40} ry={7.4} />
    </g>
  );
};
