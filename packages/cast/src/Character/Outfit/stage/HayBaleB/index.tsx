import * as styles from "./styles.js";

// hay-bale b (country Stage), ported from the harness's country-show.js: one
// soft straw block 25 by 12.6 standing on the floor in front of the breast,
// its base level with the feet so the bird keeps its own floor line. What
// makes it hay and not a crate or a cheese: corners rounded 2.6, a top bowed
// up 1, five wisps leaning out of the top, four tufts splayed out of each cut
// end, and two ink twine bands. Nothing on its face (strands read as concrete
// scratches). The bird paints over its left end. A showpiece: never drawn in
// a game.
//
// The shapes are the harness's `bale(...)` written out.
const BALE =
  "M 60 61.6 A 2.6 2.6 0 0 1 62.6 59 L 62.2 59.08 L 59.98 55.04 L 64.6 58.64 L 64.8 58.6 L 64.09 55.13 L 67.2 58.29 L 68.2 58.19 L 69.2 58.11 L 70.2 58.05 L 71.2 58.02 L 71.3 58.01 L 72.99 55.2 L 73.7 58.01 L 74.7 58.05 L 75.7 58.1 L 76.7 58.18 L 77.2 58.23 L 80.31 55.06 L 79.6 58.51 L 80.4 58.64 L 85.02 55.04 L 82.8 59.08 L 82.4 59 A 2.6 2.6 0 0 1 85 61.6 L 87.4 61.73 L 85 63.45 L 88 64.78 L 85 65.3 L 87.25 65.93 L 85 67.15 L 87.85 68.78 L 85 69 L 85 69 A 2.6 2.6 0 0 1 82.4 71.6 L 62.6 71.6 A 2.6 2.6 0 0 1 60 69 L 57.6 67.28 L 60 67.15 L 57 66.63 L 60 65.3 L 57.75 64.08 L 60 63.45 L 57.15 63.23 L 60 61.6 Z";

const TWINE = "M 67 58.91 L 67 71 M 80 59.17 L 80 71";

// Its one style is `ink` (the twine and outline), so the drawing reads nothing
// from its context.
export const HayBaleB = (): JSX.Element => {
  return (
    <g>
      <path className={styles.bale} d={BALE} />
      <path className={styles.twine} d={TWINE} />
    </g>
  );
};
