import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// suede-sleeve b (country Sleeve), ported from the harness's country-kit.js: a
// suede gauntlet. The black sleeve ends in a tan (mutedWarm) cuff at the
// wing's tip, its back 5 units, behind one ink seam; and the cuff's flared
// point breaks the silhouette below the back corner, down to (24,53.5). The
// flare is drawn under the wing, the cuff and seam clipped to it, and the
// wing's outline restroked last over the seam's ends.
const FLARE = "M 28.4 46 C 27 49.6 25.6 52 24 53.5 C 27.4 53.6 30.4 52.8 33 51 Z";

const CUFF = "M 20 30 L 32.6 30 L 31.4 56 L 20 56 Z";

const SEAM = "M 32.4 34 L 31.2 53";

export const SuedeSleeveB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.wing} />
        </clipPath>
      </defs>
      <path className={`${styles.suedeFill} ${styles.inkEdge}`} d={FLARE} />
      <path className={`${styles.styleFill[context.style ?? "ink"]} ${styles.inkEdge}`} d={context.shapes.wing} />
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.suedeFill} d={CUFF} />
        <path className={styles.seam} d={SEAM} />
      </g>
      <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.wing} />
    </g>
  );
};
