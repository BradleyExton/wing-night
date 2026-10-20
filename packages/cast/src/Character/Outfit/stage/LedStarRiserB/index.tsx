import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// led-star-riser b (pop Stage), ported from the harness's pop-show.js: a
// marquee band, the drum inside out. A team-pink top under the feet on a tall
// lit band whose front carries five big unoutlined pink stars, 13 apart on
// its curved front: few and big, a marquee of lights and not a dotted cake.
//
// The band is the harness's template, sum and all (68.4 + 8.4 is the float it
// wrote); the studs are its five `star(x, front(x) + 4.2, 4.2)`, written out.
const BAND_BOTTOM = 68.4 + 8.4;

const BAND = `M 6 68.4 L 6 ${BAND_BOTTOM} A 32 3.2 0 0 0 70 ${BAND_BOTTOM} L 70 68.4 Z`;

const STUDS = "M 12 70.27 L 13.23 72.77 L 15.99 73.17 L 14 75.11 L 14.47 77.86 L 12 76.57 L 9.53 77.86 L 10 75.11 L 8.01 73.17 L 10.77 72.77 Z M 25 71.32 L 26.23 73.83 L 28.99 74.23 L 27 76.17 L 27.47 78.92 L 25 77.62 L 22.53 78.92 L 23 76.17 L 21.01 74.23 L 23.77 73.83 Z M 38 71.6 L 39.23 74.1 L 41.99 74.5 L 40 76.45 L 40.47 79.2 L 38 77.9 L 35.53 79.2 L 36 76.45 L 34.01 74.5 L 36.77 74.1 Z M 51 71.32 L 52.23 73.83 L 54.99 74.23 L 53 76.17 L 53.47 78.92 L 51 77.62 L 48.53 78.92 L 49 76.17 L 47.01 74.23 L 49.77 73.83 Z M 64 70.27 L 65.23 72.77 L 67.99 73.17 L 66 75.11 L 66.47 77.86 L 64 76.57 L 61.53 77.86 L 62 75.11 L 60.01 73.17 L 62.77 72.77 Z";

export const LedStarRiserB = ({ context }: OutfitItemProps): JSX.Element => (
  <g>
    <path className={`${styles.styleFill[context.style ?? "white"]} ${styles.inkEdge}`} d={BAND} />
    <path className={styles.teamFill} d={STUDS} />
    <ellipse className={styles.top} cx={38} cy={68.4} rx={32} ry={3.2} />
  </g>
);
