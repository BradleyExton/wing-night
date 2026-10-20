import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// neon-flames a (disco Stage), ported from the harness's disco-show.js: two
// flame signs standing on a neon floor line, one behind the tail leaning back
// and one in front of the chest leaning forward, where the bird never covers
// them. Tubes, never fire: metal owns real flame and ember. Each is the
// fire-emoji outline, a round bulb with a tall S-curved main tongue and a
// short side tongue split ABOVE the bulb, so the tips are uneven (a split from
// the base is an M, a crown), with a solid teardrop heart in the bulb. Team is
// a team tube with a white core and a white heart; white is a plain white
// tube with a team heart. The back flame buzzes off and on.
//
// The shapes are the harness's floor tube, `flameOutline` and `flameCore` at
// x 6 and 74 (scaled 1 × 0.94 to stand 18.8 tall), written out.
const FLOOR = "M -6 74 L 86 74";

const BACK_FLAME =
  "M 0.5 68.83 A 5.5 5.17 0 0 0 6 74 A 5.5 5.17 0 0 0 11.5 68.83 C 11.5 66.1 9.6 64.6 11.4 61.59 C 9.2 62.16 7.6 63.28 6.5 63.66 C 4.6 61.78 5.6 58.21 3 55.2 C 1.8 57.83 -0.8 61.59 0.5 68.83 Z";

const BACK_HEART = "M 8.25 70.05 C 8.25 67.61 6.2 65.73 5.3 63.85 C 3.64 65.92 3.75 67.8 3.75 70.05 A 2.25 2.12 0 0 0 8.25 70.05 Z";

const FRONT_FLAME =
  "M 79.5 68.83 A 5.5 5.17 0 0 1 74 74 A 5.5 5.17 0 0 1 68.5 68.83 C 68.5 66.1 70.4 64.6 68.6 61.59 C 70.8 62.16 72.4 63.28 73.5 63.66 C 75.4 61.78 74.4 58.21 77 55.2 C 78.2 57.83 80.8 61.59 79.5 68.83 Z";

const FRONT_HEART =
  "M 71.75 70.05 C 71.75 67.61 73.8 65.73 74.7 63.85 C 76.36 65.92 76.25 67.8 76.25 70.05 A 2.25 2.12 0 0 1 71.75 70.05 Z";

// The harness's `tube`: a team tube with its white core, or one white tube.
const Tube = ({ d, white }: { d: string; white: boolean }): JSX.Element => (
  <g className={styles.tube}>
    {white ? (
      <path className={styles.whiteGlass} d={d} />
    ) : (
      <>
        <path className={styles.teamGlass} d={d} />
        <path className={styles.hotCore} d={d} />
      </>
    )}
  </g>
);

export const NeonFlamesA = ({ context }: OutfitItemProps): JSX.Element => {
  const white = (context.style ?? "team") === "white";
  const heart = white ? styles.teamFill : styles.whiteFill;

  return (
    <g>
      <Tube d={FLOOR} white={white} />
      <g className={styles.buzz}>
        <Tube d={BACK_FLAME} white={white} />
        <path className={heart} d={BACK_HEART} />
      </g>
      <g>
        <Tube d={FRONT_FLAME} white={white} />
        <path className={heart} d={FRONT_HEART} />
      </g>
    </g>
  );
};
