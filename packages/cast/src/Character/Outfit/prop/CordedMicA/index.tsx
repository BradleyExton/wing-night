import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// corded-mic a (pop Prop), ported from the harness's pop-show.js: sung into,
// the egg head half off the breast on the dark page and the cone handle
// rising about 43 degrees from the wing toward the beak. The cable loops back
// up from the butt onto the pink under the wing and tucks under the handle:
// dark on pink, not ink lost on the page. No grille stripes (they read as
// teeth). White or gold: an ink head dies on the ink outline.
//
// The mic is the harness's `cordedMic([61.5,46.3], [48.5,58.3])` (cone
// handle, collar band, egg) and the cord its `cable(...)`, written out.
const CABLE = "M 45.33 61.22 C 42.6 61.4 40.6 59.6 40.9 57.4 C 41.2 55.2 44 54.4 45.6 55.6 C 46.8 56.5 46.6 58 46 58.8";

const HANDLE = "M 53.74 49.1 L 44.11 59.9 L 46.56 62.54 L 58.09 53.81 Z";

const COLLAR = "M 54.84 47.34 L 53.08 48.97 L 58.17 54.48 L 59.93 52.85 Z";

const EGG = "M 66.5 41.69 A 6.8 6 137.29 1 0 56.5 50.91 A 6.8 6 137.29 1 0 66.5 41.69 Z";

export const CordedMicA = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={styles.cable} d={CABLE} />
      <path className={`${body} ${styles.handleEdge}`} d={HANDLE} />
      <path className={styles.collarBand} d={COLLAR} />
      <path className={`${body} ${styles.eggEdge}`} d={EGG} />
    </g>
  );
};
