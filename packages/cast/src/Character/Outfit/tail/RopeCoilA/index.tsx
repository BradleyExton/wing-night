import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// rope-coil a (country Tail), ported from the harness's country-kit.js: a
// lariat hung on the tail like on a saddle horn. One big teardrop loop (15
// wide, 19 tall, so it is a loop and never an eye) hanging off the upper
// plume, the lower plume passing through it, and a knot where it hangs. Rope
// is ONE rope, never bands round a plume (they read as raccoon or barber
// stripes): an ink core on a wider mutedWarm casing, or a white rope on ink.
const LOOP = "M 4.6 39 C -3.6 41.6 -4.6 55.4 3 57.2 C 10.8 59 12.4 46.4 4.6 39";

const KNOT = "M 2.6 37.2 H 6.6 V 41.2 H 2.6 Z";

export const RopeCoilA = ({ context }: OutfitItemProps): JSX.Element => {
  const rope = context.style === "white" ? "white" : "ink";

  return (
    <g>
      <path className={styles.ropeCasing[rope]} d={LOOP} />
      <path className={styles.ropeCore[rope]} d={LOOP} />
      <path className={styles.ropeKnot[rope]} d={KNOT} />
    </g>
  );
};
