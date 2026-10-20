import type { OutfitItemProps } from "../../context/index.js";
import { frontX } from "../../paths/countryKit/index.js";
import * as styles from "./styles.js";

// bandana a (country Top), ported from the harness's country-kit.js: round
// one's kite neckerchief a size up, hung from the shoulders with one point
// down the chest, its knot dropped below the neck line so a drawn head still
// shows it. The knot is ink on the white cloth, the team colour on the ink.
//
// It hangs from `head.shoulders` and its front corner stops at the body's
// front edge, so the path is built here from the harness's own sums.
export const BandanaA = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "white";
  const s = context.head.shoulders;
  const x = 54;
  const cloth =
    `M ${x - 10} ${s} Q ${x} ${s + 7} ${Math.min(x + 9, frontX(s + 1, 1))} ${s + 1}` +
    ` Q ${x + 7} ${s + 11} ${x - 0.5} ${s + 19}` +
    ` Q ${x - 6} ${s + 11} ${x - 10} ${s} Z`;
  const k = s + 3.5;
  const knot =
    `M ${x - 4.2} ${k} Q ${x} ${k + 3.6} ${x + 4} ${k + 0.4}` +
    ` Q ${x + 3} ${k + 4} ${x} ${k + 5.2} Q ${x - 3} ${k + 4} ${x - 4.2} ${k} Z`;

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={cloth} />
      <path className={style === "ink" ? styles.teamFill : styles.inkFill} d={knot} />
    </g>
  );
};
