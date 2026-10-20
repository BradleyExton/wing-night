import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// puff-sleeve b (pop Sleeve), ported from the harness's pop-kit.js: the star
// sleeve, the whole wing an ink sleeve with one big upright star on it, team
// by default and white as a style. The harness's `wingGarment` round the
// harness's `starPath(34, 43.6, 9.5)`, written out.
const STAR =
  "M 34.00 34.10 L 36.51 40.14 L 43.04 40.66 L 38.07 44.92 L 39.58 51.29 L 34.00 47.88 L 28.42 51.29 L 29.93 44.92 L 24.96 40.66 L 31.49 40.14 Z";

export const PuffSleeveB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.wing} />
        </clipPath>
      </defs>
      <path className={`${styles.inkFill} ${styles.inkEdge}`} d={context.shapes.wing} />
      <g clipPath={`url(#${clipId})`}>
        <path className={`${styles.styleFill[context.style ?? "team"]} ${styles.inkEdge}`} d={STAR} />
      </g>
      <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.wing} />
    </g>
  );
};
