import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// trophy-buckle a (country Top), ported from the harness's country-kit.js: a
// sheriff's star buckle, 16 units across, on an ink belt stub at the belly.
// Five points, so it is a star at 76px and never an egg or an eye; white
// only (gold is 1.30:1 on the orange). The belt starts clear of the wing
// grip (31,51), where the lasso hangs.
//
// The star is the harness's `starPath(55, 54.5, 8.2)` written out.
const BELT = "M 40 52 L 67.3 51.5 C 67 53.5 66.4 55.5 65.6 57 L 40 57.5 Z";

const STAR =
  "M 55.00 46.30 L 57.17 51.51 L 62.80 51.97 L 58.51 55.64 L 59.82 61.13 L 55.00 58.19 L 50.18 61.13 L 51.49 55.64 L 47.20 51.97 L 52.83 51.51 Z";

export const TrophyBuckleA = ({ context }: OutfitItemProps): JSX.Element => {
  return (
    <g>
      <path className={styles.inkFill} d={BELT} />
      <path className={`${styles.styleFill[context.style ?? "white"]} ${styles.inkEdge}`} d={STAR} />
    </g>
  );
};
