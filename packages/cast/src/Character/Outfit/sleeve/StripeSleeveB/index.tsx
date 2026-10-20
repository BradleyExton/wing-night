import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// stripe-sleeve b (pop Sleeve), ported from the harness's pop-kit.js: three
// stripes, three white bars slanted across the wing 5.2 apart centre to
// centre so the gaps match the bars, the sportswear mark. The harness's
// `wingGarment`: the wing redrawn in the style, the bars kept to it, then its
// outline restored over them.
const BARS = ["M 20 31 L 32 57.5", "M 25.2 29 L 37.2 55.5", "M 30.4 27 L 42.4 53.5"];

export const StripeSleeveB = ({ context }: OutfitItemProps): JSX.Element => {
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
        {BARS.map((d) => (
          <path key={d} className={styles.bar} d={d} />
        ))}
      </g>
      <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.wing} />
    </g>
  );
};
