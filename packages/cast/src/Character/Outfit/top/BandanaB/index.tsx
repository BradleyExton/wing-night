import type { OutfitItemProps } from "../../context/index.js";
import { frontX } from "../../paths/countryKit/index.js";
import * as styles from "./styles.js";

// bandana b (country Top), ported from the harness's country-kit.js: the
// outlaw bib. One big cloth triangle from the shoulders down to the belly,
// its point swung back a touch as if it caught the wind, under a rolled band
// round the neck: ink on the white cloth, the team colour on the ink.
//
// Both shapes hang from `head.shoulders` and run to the body's front edge, so
// they are built here from the harness's own sums.
export const BandanaB = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "white";
  const s = context.head.shoulders;
  const r1 = frontX(s + 2, 1.2);
  const cloth =
    `M 45 ${s + 1.5} Q 56 ${s + 6} ${r1} ${s + 2}` +
    ` Q ${frontX(s + 9, 1.5)} ${s + 9} 60 ${s + 15} Q 56 ${s + 19} 52 ${s + 23}` +
    ` Q 49 ${s + 14} 45 ${s + 1.5} Z`;
  const band =
    `M 44.5 ${s} Q 56 ${s + 5} ${frontX(s, 0.8)} ${s}` +
    ` L ${frontX(s + 4, 0.8)} ${s + 4} Q 56 ${s + 9} 44.5 ${s + 4} Z`;

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={cloth} />
      <path className={`${style === "ink" ? styles.teamFill : styles.inkFill} ${styles.inkEdgeThin}`} d={band} />
    </g>
  );
};
