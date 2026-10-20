import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// neon-flames b (disco Stage), ported from the harness's disco-show.js: two
// different neon signs on one floor tube, so there is never a row (a row of
// pointed glyphs under the bird is a jaw). A big flame sign behind the tail,
// the fire-emoji outline leaning back, and a big five-point star in front of
// the chest, tipped 16 degrees so it stands on one lower point and is never
// upside down; no post, because a star on a stick read as a wand. The star
// ties the stage to disco rather than to metal's fire. Team is a team tube
// with a white core and a white heart; white is a white tube with a team heart.
//
// The shapes are the harness's floor tube, `flameOutline` / `flameCore` at
// x 8.5 scaled 1.3 × 0.94, and `starPts` (r 8.6 and its 0.4 heart), written out.
const FLOOR = "M -6 74 L 86 74";

const FLAME =
  "M 1.35 68.83 A 7.15 5.17 0 0 0 8.5 74 A 7.15 5.17 0 0 0 15.65 68.83 C 15.65 66.1 13.18 64.6 15.52 61.59 C 12.66 62.16 10.58 63.28 9.15 63.66 C 6.68 61.78 7.98 58.21 4.6 55.2 C 3.04 57.83 -0.34 61.59 1.35 68.83 Z";

const FLAME_HEART =
  "M 11.43 70.05 C 11.43 67.61 8.76 65.73 7.59 63.85 C 5.43 65.92 5.57 67.8 5.57 70.05 A 2.93 2.12 0 0 0 11.43 70.05 Z";

const STAR =
  "M 74.37 56.65 L 75.05 62.54 L 80.59 64.62 L 75.21 67.08 L 74.94 73 L 70.93 68.64 L 65.22 70.21 L 68.13 65.05 L 64.87 60.11 L 70.68 61.28 Z";

const STAR_HEART =
  "M 72.95 61.61 L 73.22 63.97 L 75.44 64.8 L 73.28 65.78 L 73.18 68.15 L 71.57 66.41 L 69.29 67.04 L 70.45 64.97 L 69.15 63 L 71.47 63.46 Z";

type TubeProps = { d: string; white: boolean; big?: boolean };

// The harness's `tube`: a team tube with its white core, or one white tube.
const Tube = ({ d, white, big = false }: TubeProps): JSX.Element => (
  <g className={styles.tube}>
    {white ? (
      <path className={big ? styles.bigWhiteGlass : styles.whiteGlass} d={d} />
    ) : (
      <>
        <path className={big ? styles.bigTeamGlass : styles.teamGlass} d={d} />
        <path className={big ? styles.bigHotCore : styles.hotCore} d={d} />
      </>
    )}
  </g>
);

export const NeonFlamesB = ({ context }: OutfitItemProps): JSX.Element => {
  const white = (context.style ?? "team") === "white";
  const heart = white ? styles.teamFill : styles.whiteFill;

  return (
    <g>
      <Tube d={FLOOR} white={white} />
      <g className={styles.flameBeat}>
        <Tube d={FLAME} white={white} big />
        <path className={heart} d={FLAME_HEART} />
      </g>
      <g className={styles.starBeat}>
        <Tube d={STAR} white={white} big />
        <path className={heart} d={STAR_HEART} />
      </g>
    </g>
  );
};
