import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// vinyl b (disco Prop), ported from the harness's disco-show.js: the LP
// leaving its sleeve, held up on the back where the wing meets the tail. A
// white square jacket at a slight tilt with a diagonal band of cover art in
// the style (team or gold), and the black record slid up and back out of its
// top-back corner, most of a disc against the cyan tail sickles, with one
// white sheen along its rim. No label and no spindle hole: a team label on the
// team body reads as a hole, and a light dot with a dark centre is an eye.
//
// The shapes are the harness's sleeve (`boxPts(21, 39, 12.5, 12.5, -8)`), its
// band, and the record's `circle` and `arc`, written out; the sheen keeps the
// harness's unrounded radius.
const SLEEVE = "M 13.94 33.68 L 26.32 31.94 L 28.06 44.32 L 15.68 46.06 Z";

const BAND = "M 10.44 50.08 L 30.87 22.97 L 31.56 27.92 L 11.13 55.03 Z";

const RECORD = "M 10.51 31.45 A 6.4 6.4 0 1 0 23.31 31.45 A 6.4 6.4 0 1 0 10.51 31.45 Z";

const SHEEN = "M 12.75 29.05 A 4.800000000000001 4.800000000000001 0 0 1 16.91 26.65";

export const VinylB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={SLEEVE} />
        </clipPath>
      </defs>
      <path className={styles.record} d={RECORD} />
      <path className={styles.sheen} d={SHEEN} />
      <path className={styles.whiteFill} d={SLEEVE} />
      <path className={styles.styleFill[context.style ?? "team"]} clipPath={`url(#${clipId})`} d={BAND} />
      <path className={styles.outline} d={SLEEVE} />
    </g>
  );
};
