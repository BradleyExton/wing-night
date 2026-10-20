import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// stripe-sleeve a (pop Sleeve), ported from the harness's pop-kit.js: the
// tracksuit's arm, two white bands down the wing from the shoulder to the
// tip along its long axis. The harness's `wingGarment`: the wing redrawn in
// the style, the bands kept to it, then its outline restored over them.
const BANDS = ["M 51 38.5 C 41 34.5 29 37 22.5 46.5", "M 51 43.5 C 42 40 31 42.5 25.5 51.5"];

export const StripeSleeveA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.wing} />
        </clipPath>
      </defs>
      <path className={`${styles.styleFill[context.style ?? "team"]} ${styles.inkEdge}`} d={context.shapes.wing} />
      <g clipPath={`url(#${clipId})`}>
        {BANDS.map((d) => (
          <path key={d} className={styles.band} d={d} />
        ))}
      </g>
      <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.wing} />
    </g>
  );
};
