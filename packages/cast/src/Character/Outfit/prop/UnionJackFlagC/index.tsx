import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// union-jack-flag c (pop Prop), ported from the harness's pop-show.js: waved
// high, the pole raised up and back from the wing and the flag flying back
// off its top over the bay, its fly end lifted toward the tail tip. In ink its
// white hem draws its outline on the dark page; it never comes near the face.
//
// The harness's flat `unionJack` parallelogram, written out: the outline,
// the saltire, the cross and the centre line. Its hem is mitered where the
// waving flags' is round.
const POLE = "M 36 45.5 L 30.2 18.2";

const FLAG = "M 30.2 19 L 12.4 15 L 13.3 25.4 L 31.1 29.4 Z";

const SALTIRE = "M 35.46 15.94 L 7.33 26.59 L 8.04 28.46 L 36.17 17.81 Z M 36.46 32.27 L 8.26 10.55 L 7.04 12.13 L 35.24 33.85 Z";

const CROSS = "M 36.88 23.86 L 7.37 17.23 L 6.62 20.54 L 36.13 27.17 Z M 19.09 11.17 L 21.02 33.52 L 24.41 33.23 L 22.48 10.88 Z";

const CENTRE = "M 36.72 24.54 L 7.22 17.91 L 6.78 19.86 L 36.28 26.49 Z M 19.79 11.11 L 21.72 33.46 L 23.71 33.29 L 21.78 10.94 Z";

export const UnionJackFlagC = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const style = context.style ?? "ink";
  const dark = style === "ink";

  return (
    <g>
      <path className={styles.pole} d={POLE} />
      <defs>
        <clipPath id={clipId}>
          <path d={FLAG} />
        </clipPath>
      </defs>
      <path className={styles.styleFill[style]} d={FLAG} />
      <g clipPath={`url(#${clipId})`}>
        {dark ? <path className={styles.hem} d={FLAG} /> : null}
        <path className={dark ? styles.whiteFill : styles.teamFill} d={SALTIRE} />
        <path className={dark ? styles.whiteFill : styles.teamFill} d={CROSS} />
        {dark ? <path className={styles.teamFill} d={CENTRE} /> : null}
      </g>
      <path className={`${styles.unfilled} ${styles.inkEdge}`} d={FLAG} />
    </g>
  );
};
