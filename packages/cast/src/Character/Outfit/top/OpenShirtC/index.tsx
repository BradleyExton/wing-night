import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { CHEST } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// open-shirt c (disco Top), ported from the harness's disco-kit.js: the sequin
// shirt. The same open ink shirt, the glitter on the cloth: one big ember
// four-point sparkle on the panel below the wing and a smaller one down and
// behind it on a diagonal, never level and never the same size, so the two
// can never pair into eyes.
const OPEN_V = "M 49 37 L 67 37 L 56 52 Z";

// The harness's `sparkle(46.6, 47.3, 6.2)` and `sparkle(37.2, 50.8, 4.2)`.
const SPARKLE_BIG =
  "M 46.60 41.10 L 48.44 45.46 L 52.80 47.30 L 48.44 49.14 L 46.60 53.50 L 44.76 49.14 L 40.40 47.30 L 44.76 45.46 Z";

const SPARKLE_SMALL =
  "M 37.20 46.60 L 38.45 49.55 L 41.40 50.80 L 38.45 52.05 L 37.20 55.00 L 35.95 52.05 L 33.00 50.80 L 35.95 49.55 Z";

export const OpenShirtC = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.styleFill[context.style ?? "ink"]} d={CHEST} />
        <path className={styles.opening} d={OPEN_V} />
        <path className={styles.sequin} d={SPARKLE_BIG} />
        <path className={styles.sequin} d={SPARKLE_SMALL} />
      </g>
    </g>
  );
};
