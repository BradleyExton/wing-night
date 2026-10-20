import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// tail-bandana a (country Tail), ported from the harness's country-kit.js: a
// kerchief slung under the tail. The cloth wraps the lower plume's bend from
// (2.2,45) to the body edge, so the plume runs into it and its tip pokes out
// behind, and drops to one point at (6.8,62.4), 9 under the plume (inside the
// Tail region's 10). Knotted at the back with a square knot and ONE broad tie
// end flying back: point down and tied on, never a lone up-left arrowhead
// (it read as a cursor).
const TIE_END = "M 1 45.8 Q -3.6 46.6 -6.8 51.8 Q -1.8 53.2 2.2 49.2 Z";

const CLOTH = "M 2.2 45.2 Q 8.6 48.8 15 46 L 15 52 Q 11.8 57.8 6.8 62.4 Q 3.4 55.2 2.2 45.2 Z";

const KNOT = "M -0.4 42.8 L 4 42.6 L 4.6 47.6 L 0 47.8 Z";

export const TailBandanaA = ({ context }: OutfitItemProps): JSX.Element => {
  const cloth = `${styles.styleFill[context.style ?? "white"]} ${styles.inkEdge}`;

  return (
    <g>
      <path className={cloth} d={TIE_END} />
      <path className={cloth} d={CLOTH} />
      <path className={cloth} d={KNOT} />
    </g>
  );
};
