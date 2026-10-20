import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// little-black-dress a (pop Top), ported from the harness's pop-kit.js: the
// front hourglass on straps. A straight neckline at y 44 leaves a big chest
// of the bird's own colour above it, held by two ink straps from under the
// neck (which paints over their tops). The dress cuts a pointed waist wedge
// into the front edge, so ink never lies flat on the outline, flares straight
// back out to the front-bottom corner, and runs back under the wing: its top
// edge there IS the wing's scalloped trailing edge.
const PANEL =
  "M 48.8 44 L 72 44 L 72 46.6 L 63.9 46.6 C 60 47.6 56 49.2 54.4 51 C 56.6 52.8 58.8 54.3 61.2 55.8 L 44 59 L 24 58 L 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51 C 47.5 48.5 48.8 46 48.8 44 Z";

const STRAPS = ["M 54.6 37.4 L 56 44.5", "M 59.4 39.6 L 60.4 44.5"];

export const LittleBlackDressA = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const panelClipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
        <clipPath id={panelClipId}>
          <path d={PANEL} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={`${styles.styleFill[context.style ?? "ink"]} ${styles.inkEdge}`} d={PANEL} />
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
      {STRAPS.map((d) => (
        <path key={d} className={styles.strap} d={d} />
      ))}
    </g>
  );
};
