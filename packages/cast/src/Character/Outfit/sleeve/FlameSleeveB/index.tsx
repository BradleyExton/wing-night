import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// flame-sleeve b (metal Sleeve), ported from the harness's metal-kit.js: the
// hot-rod decal. Ember flames painted ON the ink wing, starting at the
// shoulder and licking back in three tongues to the wing's tip, clipped to
// the wing, then the wing's mitered outline over the lot. Surface, not
// outline: one 20-unit flat shape at 9:1 against the ink.
const DECAL =
  "M 50 37 C 45 35.6 39 35.4 31.6 35.8 C 36 37.4 38.6 38.6 40.4 39.8 C 34 39.8 27.6 41 21.4 44.6 C 28.6 43.8 34.6 43.8 39.6 44.6 C 35 46 31 48.4 28 52 C 34.6 49 41.6 47.6 50 47.6 Z";

export const FlameSleeveB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.wing} />
        </clipPath>
      </defs>
      <path className={styles.styleFill[context.style ?? "ink"]} d={context.shapes.wing} />
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.emberDecal} d={DECAL} />
      </g>
      <path className={styles.wingOutline} d={context.shapes.wing} />
    </g>
  );
};
