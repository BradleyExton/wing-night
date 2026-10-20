import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// star-mic b (pop Prop), ported from the harness's pop-show.js: held up to
// sing, the fat handle rising about 33 degrees from the wing toward the beak
// and the star (r 8.6, a tip straight up) half past the breast on the dark
// page, its top tip at y 39.6 so the walk tuck keeps it out of the head box.
// A mic held up under the chin.
//
// The handle is the harness's `micHandle([49,57.4], [58.6,51], 2.4, 3)` and
// the head its `star(63.2, 48.2, 8.6)`, written out.
const HANDLE = "M 50.33 59.4 L 51.99 58.41 L 53.64 57.43 L 55.3 56.45 L 56.95 55.46 L 58.61 54.48 L 60.26 53.5 L 56.94 48.5 L 55.39 49.65 L 53.85 50.8 L 52.3 51.95 L 50.76 53.1 L 49.21 54.25 L 47.67 55.4 Z";

const GRIP = "M 59.22 55.05 L 55.1 48.87";

const STAR = "M 63.2 39.6 L 65.73 44.72 L 71.38 45.54 L 67.29 49.53 L 68.25 55.16 L 63.2 52.5 L 58.15 55.16 L 59.11 49.53 L 55.02 45.54 L 60.67 44.72 Z";

export const StarMicB = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={`${body} ${styles.handleEdge}`} d={HANDLE} />
      <path className={styles.gripCollar} d={GRIP} />
      <path className={`${body} ${styles.inkEdge}`} d={STAR} />
    </g>
  );
};
