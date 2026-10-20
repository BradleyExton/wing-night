import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// star-mic a (pop Prop), ported from the harness's pop-show.js: the mic held
// out back at shoulder height, the fat handle running back nearly level out
// of the wing and a big star (r 9) aimed away from the face, out over the
// tail fan where its tips break the fan's outline. The sing-it-back-to-me
// gesture. White or gold, never ink (an ink star dies on the ink outline).
//
// The handle is the harness's `micHandle([40,42], [20.6,33], 2, 2.6)` (a
// ribbon and its grip collar at 0.85) and the head its `star(...)` aimed along
// the handle, written out.
const HANDLE = "M 40.84 40.19 L 37.65 38.6 L 34.46 37 L 31.27 35.41 L 28.08 33.82 L 24.89 32.23 L 21.69 30.64 L 19.51 35.36 L 22.78 36.77 L 26.06 38.18 L 29.33 39.59 L 32.61 41 L 35.88 42.4 L 39.16 43.81 Z";

const GRIP = "M 24.9 31.35 L 22.12 37.35";

const STAR = "M 5.18 25.85 L 11.15 25.7 L 14.42 20.7 L 16.41 26.34 L 22.17 27.9 L 17.43 31.53 L 17.72 37.5 L 12.8 34.1 L 7.22 36.23 L 8.93 30.5 Z";

export const StarMicA = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={`${body} ${styles.handleEdge}`} d={HANDLE} />
      <path className={styles.gripCollar} d={GRIP} />
      <path className={`${body} ${styles.inkEdge}`} d={STAR} />
    </g>
  );
};
