import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// sawdust-ring c (country Stage), ported from the harness's country-show.js:
// thrown. The sawdust (mutedWarm) arena disc with a white Stetson lying where
// it landed in front of the breast, side on: a crown leaning in to one smooth
// dent (humps under a band read as teeth), an ink hat band, and a wide brim
// flicked up hard at both ends. A hat on the arena floor says somebody just
// got bucked. The style edges the disc. A showpiece: never drawn in a game.
const CROWN =
  "M 70.2 66.2 C 69.6 62 70 58.4 71.8 56.2 C 74.6 57.8 78.4 57.8 81.2 56.2 C 83 58.4 83.4 62 82.8 66.2 C 78.6 67 74.4 67 70.2 66.2 Z";

const BAND = "M 70 62.6 C 74.2 63.6 78.8 63.6 83 62.6";

const BRIM =
  "M 64.2 60.8 C 65 66.4 69.4 70.6 76.4 70.6 C 83.4 70.6 87.6 66.6 88 60.8 C 86.4 64.4 82.4 66.4 76.4 66.4 C 70.4 66.4 66 64.4 64.2 60.8 Z";

export const SawdustRingC = ({ context }: OutfitItemProps): JSX.Element => {
  const disc = context.style === "team" ? styles.teamDisc : styles.inkDisc;

  return (
    <g>
      <ellipse className={disc} cx={39} cy={71.6} rx={33} ry={5.2} />
      <path className={styles.felt} d={CROWN} />
      <path className={styles.hatBand} d={BAND} />
      <path className={styles.felt} d={BRIM} />
    </g>
  );
};
