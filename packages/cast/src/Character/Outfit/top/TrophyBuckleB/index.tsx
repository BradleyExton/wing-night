import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// trophy-buckle b (country Top), ported from the harness's country-kit.js: a
// longhorn steer buckle, 22 by 12, on an ink belt stub at the belly. A short
// bar on the belt, two THIN horns sweeping out and up off its ends to sharp
// tips at (44,46.5) and (66.4,46.5), open hooks with orange inside their
// curve (a thick white U read as underpants), and a short wedge of face under
// the bar. One merged shape with one ink outline; no eyes, no marks.
//
// The steer is the harness's horns, bar and face written out.
const BELT = "M 40 52 L 67.3 51.5 C 67 53.5 66.4 55.5 65.6 57 L 40 57.5 Z";

const STEER =
  "M 50.4 55.2 C 46 55.2 44.2 51.8 44 46.5 C 45.4 50.4 47.2 52.6 50.4 52.6 Z M 60 55.2 C 64.4 55.2 66.2 51.8 66.4 46.5 C 65 50.4 63.2 52.6 60 52.6 Z M 49.6 52.6 H 60.8 V 55.2 H 49.6 Z M 51.9 54.6 L 58.5 54.6 L 56.6 58.5 L 53.8 58.5 Z";

export const TrophyBuckleB = ({ context }: OutfitItemProps): JSX.Element => {
  return (
    <g>
      <path className={styles.inkFill} d={BELT} />
      <path className={styles.steerOutline} d={STEER} />
      <path className={styles.styleFill[context.style ?? "white"]} d={STEER} />
    </g>
  );
};
