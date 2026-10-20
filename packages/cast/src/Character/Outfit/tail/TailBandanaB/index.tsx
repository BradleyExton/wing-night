import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// tail-bandana b (country Tail), ported from the harness's country-kit.js: a
// kerchief tied along the upper plume. Its top edge runs along the plume's
// underside from (3,37) to (13.5,41.5), so it hangs off the plume instead of
// off the tip, and its point drops to (6,48.5) over the lower plume: a
// 10-unit triangle. The knot is a solid block half tucked under the body's
// edge (ink on the white cloth, the team colour on the ink), with no loose
// ears (ears made it a mouse cursor).
const KNOT = "M 13.2 38.2 H 17 V 42.2 H 13.2 Z";

const CLOTH = "M 2.6 36.6 L 14 41.2 L 6 48.6 Z";

export const TailBandanaB = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "white";

  return (
    <g>
      <path className={`${style === "ink" ? styles.teamFill : styles.inkFill} ${styles.inkEdgeThin}`} d={KNOT} />
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={CLOTH} />
    </g>
  );
};
