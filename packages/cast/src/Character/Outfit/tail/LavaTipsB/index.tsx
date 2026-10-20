import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// lava-tips b (metal Tail), ported from the harness's metal-kit.js: the whole
// tail burning. One big ember flame mass behind all three blades, then the
// tail redrawn on top in its own chrome, mitered, so the slot adds to the
// tail and never replaces it: an aura of fire read as one silhouette.
const FIRE =
  "M 26 50.6 C 18 53 9 53 2 49.4 C 4 49 5 48.2 5.6 47.4 C -0.6 46.4 -3.4 42.8 -2.6 37.6 C -1 39.6 0.8 40.4 2.6 40 C -1.6 35 -2.6 29 -1.2 23 C -0.6 25.6 1.4 27.2 3.6 27.6 C 1.4 21.6 2.6 15 6.4 10 C 6.4 6.6 5.6 3.6 3.6 1.2 C 8.8 1.6 12.6 5 13.8 10.2 C 14.8 7.8 16.4 6.8 18.6 6.4 C 17 9.8 17.8 14 20.4 18.4 L 30 30 Z";

export const LavaTipsB = ({ context }: OutfitItemProps): JSX.Element => {
  return (
    <g>
      <path className={styles.fire} d={FIRE} />
      <path className={styles.chromeTail} d={context.shapes.tail} />
    </g>
  );
};
