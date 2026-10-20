import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// led-star-riser c (pop Stage), ported from the harness's pop-show.js: star
// posts, a low squared-off riser with a lit lid and a team-pink face, and a
// big lit star standing up on an ink post at each end, either side of the
// bird. The stars change the stage's outline: wider and taller than the feet,
// a stage set and not a disc.
//
// The stars are the harness's `star(3.5, 62.2, 7)` and
// `star(72.5, 62.2, 7)`, written out.
const POSTS = "M 3.5 68.6 L 3.5 63 M 72.5 68.6 L 72.5 63";

const BOX = "M 1 70 L 75 70 L 75 76 L 1 76 Z";

const LID = "M 1 70 L 5.5 67.4 L 70.5 67.4 L 75 70 Z";

const STARS = "M 3.5 55.2 L 5.47 59.48 L 10.16 60.04 L 6.7 63.24 L 7.61 67.86 L 3.5 65.56 L -0.61 67.86 L 0.3 63.24 L -3.16 60.04 L 1.53 59.48 Z M 72.5 55.2 L 74.47 59.48 L 79.16 60.04 L 75.7 63.24 L 76.61 67.86 L 72.5 65.56 L 68.39 67.86 L 69.3 63.24 L 65.84 60.04 L 70.53 59.48 Z";

export const LedStarRiserC = ({ context }: OutfitItemProps): JSX.Element => {
  const lit = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={styles.posts} d={POSTS} />
      <path className={`${styles.teamFill} ${styles.inkEdge}`} d={BOX} />
      <path className={`${lit} ${styles.inkEdge}`} d={LID} />
      <path className={`${lit} ${styles.inkEdge}`} d={STARS} />
    </g>
  );
};
