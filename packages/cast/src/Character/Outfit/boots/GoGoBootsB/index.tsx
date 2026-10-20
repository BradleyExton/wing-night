import type { OutfitItemProps } from "../../context/index.js";
import { SOLE } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// go-go-boots b (pop Boots), ported from the harness's pop-kit.js: the mod
// boot, a straight ink shank with a square toe and a low block heel under a
// wide fold-over cuff in the light value, flared past the shank from y 56.4
// to 63. The cuff sits below the wing's scallops so all of it shows (tucked
// under them it was a slit in a black block, a mouth), and its top covers
// the leg's round cap at the hip.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const bootPath = (x: number): string =>
  `M ${x - 3.5} 56.4 L ${x + 2.5} 56.4 L ${x + 2.5} 65.5 Q ${x + 3} 66.6 ${x + 5} 66.8 L ${x + 8} 67.2 Q ${x + 9.2} 67.4 ${x + 9.2} 69 L ${x + 9.2} ${SOLE} L ${x + 1.5} ${SOLE} Q ${x + 1} ${SOLE - 2} ${x - 0.5} ${SOLE - 2} L ${x - 0.5} ${SOLE} L ${x - 6.5} ${SOLE} L ${x - 6.5} 68.6 Q ${x - 5.5} 67.2 ${x - 3.5} 66.6 Z`;

const cuffPath = (x: number): string => `M ${x - 5.5} 56.4 L ${x + 4.5} 56.4 L ${x + 3.6} 63 L ${x - 4.6} 63 Z`;

export const GoGoBootsB = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const x = context.leg.x - 1;
  const style = context.style ?? "ink";

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={bootPath(x)} />
      {/* the cuff in the colour that reads on the boot: white on ink, ink on white */}
      <path className={`${style === "ink" ? styles.whiteFill : styles.inkFill} ${styles.inkEdge}`} d={cuffPath(x)} />
    </g>
  );
};
