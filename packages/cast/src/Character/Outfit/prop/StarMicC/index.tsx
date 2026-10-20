import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// star-mic c (pop Prop), ported from the harness's pop-show.js: raised up and
// back behind the head, the star in the dark bay above the back with a tip
// aimed straight up the handle, which rises from mid-wing past the back's top
// edge. Behind the neck, never in front of the face; the heart-point throws
// it out front at chest height, a mic pointed at the room.
//
// The handle is the harness's `micHandle([36.5,44], [29,30.5], 2, 2.6)` and
// the head its `star(25.4, 24.2, 8.4)` aimed along the handle, written out.
const HANDLE = "M 38.25 43.03 L 37.09 40.73 L 35.92 38.43 L 34.76 36.13 L 33.6 33.83 L 32.44 31.54 L 31.27 29.24 L 26.73 31.76 L 28.06 33.96 L 29.4 36.17 L 30.74 38.37 L 32.08 40.57 L 33.41 42.77 L 34.75 44.97 Z";

const GRIP = "M 33.02 30.92 L 27.23 34.13";

const STAR = "M 21.32 16.86 L 25.91 20.03 L 31.12 18.05 L 29.52 23.39 L 33.02 27.74 L 27.44 27.87 L 24.38 32.54 L 22.54 27.27 L 17.16 25.81 L 21.59 22.43 Z";

export const StarMicC = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={`${body} ${styles.handleEdge}`} d={HANDLE} />
      <path className={styles.gripCollar} d={GRIP} />
      <path className={`${body} ${styles.inkEdge}`} d={STAR} />
    </g>
  );
};
