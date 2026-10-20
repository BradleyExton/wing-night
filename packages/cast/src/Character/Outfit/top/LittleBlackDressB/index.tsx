import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { BOW } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// little-black-dress b (pop Top), ported from the harness's pop-kit.js:
// strapless with a big bow. A band of shoulder shows above a straight
// neckline at y 42, the bodice fills the chest, the skirt runs back under the
// wing (its top edge the wing's scalloped trailing edge), and a team rim runs
// inside the body's edge all round the dress so the ink never melts into the
// outline. A big team bow is tied at the waist, inked only round its outside:
// the harness's `silhouette`, the edge drawn first and the fill again on top.
const PANEL =
  "M 49 42.5 L 72 41.5 L 72 51 L 62 53.2 C 57 55.6 50 58.6 41 59.6 C 33 60 27 58.5 22.5 56.3 L 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51 C 49 47.5 50.2 45 49 42.5 Z";

export const LittleBlackDressB = ({ context }: OutfitItemProps): JSX.Element => {
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
      <g clipPath={`url(#${bodyClipId})`}>
        <g clipPath={`url(#${panelClipId})`}>
          <path className={styles.rim} d={context.shapes.body} />
        </g>
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
      <g transform="translate(55.5 48.6) rotate(-10) scale(0.74)">
        <path className={styles.bowEdge} d={BOW} />
        <path className={styles.teamFill} d={BOW} />
      </g>
    </g>
  );
};
