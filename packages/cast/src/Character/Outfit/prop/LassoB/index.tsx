import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// lasso b (country Prop), ported from the harness's country-show.js: the
// twirl. The loop swung up and spinning behind the tail, a flat 28×12 ellipse
// tipped toward the room, fed from the wing tip by the spoke and its honda
// knot, with the slack hanging from the hand. It rides the wing, so the
// lasso-twirl Move spins it overhead. Ink rope on a mutedWarm casing by
// default, white rope in ink the alternative; no team (1.00:1 on country).
//
// The loop is the harness's `ellipsePoints((14.6,34.1), 15, 5.4, 5°)` and the
// knot its `honda` (5 long, 3.8 across), both written out.
const SLACK = "M 30 46.5 C 26.6 49.2 22.8 50.8 21.4 54.6";

const LOOP =
  "M 29.54 35.41 L 29.35 36.1 L 28.91 36.76 L 28.23 37.37 L 27.31 37.92 L 26.17 38.41 L 24.83 38.83 L 23.32 39.16 L 21.66 39.41 L 19.88 39.57 L 18.01 39.63 L 16.08 39.6 L 14.13 39.48 L 12.18 39.26 L 10.28 38.96 L 8.45 38.57 L 6.72 38.11 L 5.13 37.57 L 3.7 36.98 L 2.46 36.34 L 1.42 35.66 L 0.61 34.95 L 0.04 34.23 L -0.28 33.51 L -0.34 32.79 L -0.15 32.1 L 0.29 31.44 L 0.97 30.83 L 1.89 30.28 L 3.03 29.79 L 4.37 29.37 L 5.88 29.04 L 7.54 28.79 L 9.32 28.63 L 11.19 28.57 L 13.12 28.6 L 15.07 28.72 L 17.02 28.94 L 18.92 29.24 L 20.75 29.63 L 22.48 30.09 L 24.07 30.63 L 25.5 31.22 L 26.74 31.86 L 27.78 32.54 L 28.59 33.25 L 29.16 33.97 L 29.48 34.69 Z";

const SPOKE = "M 30 46.5 C 29.6 42.4 28.8 38.6 28.8 36.4";

const HONDA = "M 28.64 33.9 L 30.7 36.28 L 28.96 38.9 L 26.9 36.52 Z";

export const LassoB = ({ context }: OutfitItemProps): JSX.Element => {
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
