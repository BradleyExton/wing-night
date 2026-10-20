import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// satin-sleeve a (disco Sleeve), ported from the harness's disco-kit.js: the
// track stripe. The satin wing crossed by two team bands across its back
// third, square to the wing's axis, top edge to trailing edge, satin between
// them: the stripe round a tracksuit's arm, a garment mark no feather makes (a
// plain white wing reads as a white-winged bird). The bands stay team in the
// gold style. The fill goes down first, the bands clipped to the wing, and the
// outline last, over the bands' ends.
//
// The bands are the harness's `armBand(22.6, 3.5)` and `armBand(28.1, 3.5)`,
// written out: 3.5 wide, square across the axis from the pivot (47, 34) to
// the back tip (16.6, 46).
const BANDS = [
  "M 30.10 57.87 L 26.85 59.16 L 15.10 29.39 L 18.35 28.11 Z",
  "M 35.60 55.70 L 32.35 56.99 L 20.60 27.22 L 23.85 25.94 Z"
];

export const SatinSleeveA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <path className={styles.styleFill[context.style ?? "white"]} d={context.shapes.wing} />
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.wing} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {BANDS.map((d) => (
          <path key={d} className={`${styles.teamFill} ${styles.inkEdgeThin}`} d={d} />
        ))}
      </g>
      <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.wing} />
    </g>
  );
};
