import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// corded-mic b (pop Prop), ported from the harness's pop-show.js: raised to
// sing like star-mic c, the egg head in the dark bay above the back and 8+
// units of white cone showing against the page before it enters the wing.
// The cable hangs from the butt in one loose U across the wing, ending on the
// body, never below y 60.
//
// The mic is the harness's `cordedMic([25.4,24.6], [36.6,44])` and the cord
// its `cable(...)`, written out.
const CABLE = "M 36.4 43.65 C 40 54 30 56 30 50";

const HANDLE = "M 26.43 32.78 L 34.84 44.55 L 37.96 42.75 L 31.97 29.58 Z";

const COLLAR = "M 24.95 31.32 L 26.15 33.4 L 32.65 29.65 L 31.45 27.57 Z";

const EGG = "M 22 18.71 A 6.8 6 60 1 0 28.8 30.49 A 6.8 6 60 1 0 22 18.71 Z";

export const CordedMicB = ({ context }: OutfitItemProps): JSX.Element => {
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
