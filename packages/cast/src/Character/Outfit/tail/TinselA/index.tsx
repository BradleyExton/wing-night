import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// tinsel a (disco Tail), ported from the harness's disco-kit.js: two crinkled
// foil ribbons of unequal length, one off each sickle tip, each drooping in
// one gentle curve with big zigzag teeth and ending in a fat four-point
// sparkle. The long one runs off the low sickle down the back, the short one
// off the high sickle stops above it, so the sparkles sit far apart at
// different heights and never pair into eyes. White or gold cased in ink,
// mitered so the edge is foil; no team style (team on the team sickles is
// mush).
//
// The strands are the harness's two `crinkleC` curves (12 and 7 teeth,
// ±1.6), one path; the sparkles its `sparkle(6, 37, 6)` and `sparkle(21, 17, 6)`.
const STRANDS =
  "M 9.00 10.00 L 9.25 12.78 L 5.36 13.52 L 7.51 16.84 L 3.78 18.15 L 6.41 21.11 L 2.91 22.95 L 5.93 25.50 L 2.73 27.83 L 6.09 29.94 L 3.26 32.71 L 6.88 34.34 L 6.00 37.00 M 17.00 0.00 L 19.91 1.38 L 18.25 5.14 L 22.11 6.46 L 19.52 9.61 L 22.94 11.82 L 19.71 14.32 L 21.00 17.00";

const SPARKLES = [
  "M 6.00 31.00 L 8.12 34.88 L 12.00 37.00 L 8.12 39.12 L 6.00 43.00 L 3.88 39.12 L 0.00 37.00 L 3.88 34.88 Z",
  "M 21.00 11.00 L 23.12 14.88 L 27.00 17.00 L 23.12 19.12 L 21.00 23.00 L 18.88 19.12 L 15.00 17.00 L 18.88 14.88 Z"
];

export const TinselA = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "white";

  return (
    <g>
      <path className={styles.foilCasing} d={STRANDS} />
      <path className={`${styles.styleStroke[style]} ${styles.foil}`} d={STRANDS} />
      {SPARKLES.map((d) => (
        <path key={d} className={`${styles.styleFill[style]} ${styles.sparkleEdge}`} d={d} />
      ))}
    </g>
  );
};
