import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// sawdust-ring b (country Stage), ported from the harness's country-show.js:
// the desert. The sawdust (mutedWarm) arena disc with one white saguaro
// standing on its far edge in front of the breast, two arms up: the trident
// silhouette is the West at any size, and on the floor band it never reaches
// the head. The style edges the disc. A showpiece: never drawn in a game.
const CACTUS = "M 79 71 L 79 57.4 M 79 66.4 L 74.6 66.4 L 74.6 60.4 M 79 63.4 L 83.6 63.4 L 83.6 58.6";

export const SawdustRingB = ({ context }: OutfitItemProps): JSX.Element => {
  const disc = context.style === "team" ? styles.teamDisc : styles.inkDisc;

  return (
    <g>
      <ellipse className={disc} cx={39} cy={71.6} rx={33} ry={5.2} />
      <path className={styles.cactusCasing} d={CACTUS} />
      <path className={styles.cactus} d={CACTUS} />
    </g>
  );
};
