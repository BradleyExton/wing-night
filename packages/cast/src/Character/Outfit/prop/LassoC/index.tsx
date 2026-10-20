import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// lasso c (country Prop), ported from the harness's country-show.js: the
// wind-up. The loop shaken out and held up behind the back before the swing,
// a long teardrop 14 across hanging from the honda at the wing tip, its point
// at the knot and its round end out over the tail, the slack dropping from the
// hand. Upright and drooping where lasso b is a flat spinning disc: a noose
// and never a ring (or, in white, an eye). Ink rope on a mutedWarm casing by
// default, white rope in ink the alternative.
//
// The loop is the harness's `teardrop((28.8,40.2), (4.6,34), 14)` and the
// knot its `honda` (5 long, 3.8 across, along the spoke), both written out.
const SLACK = "M 30 46.5 C 27 50.5 23.6 52 21 56.6";

const LOOP =
  "M 28.8 40.2 L 28.72 40.1 L 28.46 39.8 L 28.05 39.31 L 27.47 38.64 L 26.74 37.84 L 25.87 36.91 L 24.86 35.9 L 23.73 34.84 L 22.49 33.76 L 21.16 32.72 L 19.75 31.75 L 18.3 30.87 L 16.8 30.13 L 15.3 29.55 L 13.8 29.15 L 12.34 28.94 L 10.94 28.95 L 9.62 29.15 L 8.4 29.56 L 7.31 30.16 L 6.37 30.93 L 5.59 31.85 L 5 32.88 L 4.6 34 L 4.41 35.17 L 4.43 36.37 L 4.67 37.54 L 5.13 38.67 L 5.8 39.72 L 6.67 40.66 L 7.73 41.48 L 8.96 42.16 L 10.34 42.68 L 11.84 43.05 L 13.44 43.26 L 15.1 43.33 L 16.8 43.26 L 18.5 43.08 L 20.17 42.81 L 21.77 42.46 L 23.27 42.08 L 24.65 41.68 L 25.86 41.28 L 26.89 40.92 L 27.71 40.62 L 28.31 40.39 L 28.68 40.25 Z";

const SPOKE = "M 30 46.5 L 28.8 40.2";

const HONDA = "M 28.33 37.74 L 30.67 39.84 L 29.27 42.66 L 26.93 40.56 Z";

export const LassoC = ({ context }: OutfitItemProps): JSX.Element => {
  const rope = context.style === "white" ? styles.whiteRope : styles.inkRope;

  return (
    <g>
      <path className={rope.thinCasing} d={SLACK} />
      <path className={rope.thinCore} d={SLACK} />
      <path className={rope.loopCasing} d={LOOP} />
      <path className={rope.loopCore} d={LOOP} />
      <path className={rope.thinCasing} d={SPOKE} />
      <path className={rope.thinCore} d={SPOKE} />
      <path className={rope.honda} d={HONDA} />
    </g>
  );
};
