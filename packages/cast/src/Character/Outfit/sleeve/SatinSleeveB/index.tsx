import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// satin-sleeve b (disco Sleeve), ported from the harness's disco-kit.js: the
// glam sleeve. The satin wing with one big team star applique, thinly
// ink-edged, on the wing's broad back half, turned so a valley and not a
// point faces the trailing edge, with satin all round it: a garment mark and
// never dark-in-light (an ink star read as a pupil).
//
// The harness's `star(26.5, 41.5, 5, 5, 0.5, 35)`.
const STAR =
  "M 29.37 37.40 L 28.86 40.69 L 31.28 42.96 L 28.00 43.50 L 26.59 46.50 L 25.07 43.55 L 21.77 43.13 L 24.11 40.77 L 23.49 37.51 L 26.46 39.00 Z";

export const SatinSleeveB = ({ context }: OutfitItemProps): JSX.Element => (
  <g>
    <path className={`${styles.styleFill[context.style ?? "white"]} ${styles.inkEdge}`} d={context.shapes.wing} />
    <path className={styles.applique} d={STAR} />
  </g>
);
