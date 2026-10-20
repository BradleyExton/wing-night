import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// rope-coil b (country Tail), ported from the harness's country-kit.js: a
// rope tied at the tail root with its long end trailing back between the
// plumes in a lazy S, past their tips, ending in a frayed tassel: a third
// plume, of rope. The knot sits half under the body's edge. One rope, an ink
// core on a wider mutedWarm casing, or a white rope on ink.
const ROPE = "M 15 46 C 10 44.6 7 48.4 2.6 47.4 C -1 46.6 -2.2 44.6 -5 45.2";

const TASSEL = "M -5 45.2 L -8.4 43.2 M -5 45.2 L -8.8 46 M -5 45.2 L -7.6 48.4";

const KNOT = "M 12.4 43.5 H 16.8 V 48.5 H 12.4 Z";

export const RopeCoilB = ({ context }: OutfitItemProps): JSX.Element => {
  const rope = context.style === "white" ? "white" : "ink";

  return (
    <g>
      <path className={styles.ropeCasing[rope]} d={ROPE} />
      <path className={styles.ropeCore[rope]} d={ROPE} />
      <path className={styles.tasselCasing[rope]} d={TASSEL} />
      <path className={styles.tasselCore[rope]} d={TASSEL} />
      <path className={styles.ropeKnot[rope]} d={KNOT} />
    </g>
  );
};
