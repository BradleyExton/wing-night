import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// sawdust-ring a (country Stage), ported from the harness's country-show.js:
// barrel racing. The rodeo arena floor, a sawdust (mutedWarm) disc under the
// feet, never an annulus (a light ring round a dark middle is an eye), with
// one wooden barrel standing on it in front of the breast: bulged, two ink
// hoops, two curved staves and its lid showing. The barrel is the team colour
// in either style; it stands on the dark floor off the bird, so it contrasts
// there. The style edges the disc. A showpiece: never drawn in a game.
const BARREL = "M 72.6 57.4 Q 69.2 64.4 72.6 71.6 L 83.4 71.6 Q 86.8 64.4 83.4 57.4 Z";

const STAVES = "M 75.4 58.6 Q 73.8 64.7 75.4 70.8 M 80.6 58.6 Q 82.2 64.7 80.6 70.8";

const HOOPS = "M 71.4 61.6 Q 78 63 84.6 61.6 M 71.4 67.4 Q 78 68.8 84.6 67.4";

export const SawdustRingA = ({ context }: OutfitItemProps): JSX.Element => {
  const disc = context.style === "team" ? styles.teamDisc : styles.inkDisc;

  return (
    <g>
      <ellipse className={disc} cx={39} cy={71.6} rx={33} ry={5.2} />
      <path className={styles.barrel} d={BARREL} />
      <path className={styles.staves} d={STAVES} />
      <path className={styles.hoops} d={HOOPS} />
      <ellipse className={styles.lid} cx={78} cy={57.4} rx={5.4} ry={1.6} />
    </g>
  );
};
