import type { OutfitItemProps } from "../../context/index.js";
import { SOLE } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// go-go-boots a (pop Boots), ported from the harness's pop-kit.js: the white
// sixties knee-high with a block heel. The shank flares to a 10u mouth at the
// body's edge (y 56), so the top reads as a boot mouth against the belly,
// with a pointed toe and a heel block behind a notch under the arch (the
// notch filled ink: open, it showed the orange toes). A white boot reads on
// the floor by itself; in ink it carries a patent shine and a sole line.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const archPath = (x: number): string =>
  `M ${x + 1.5} ${SOLE} L ${x + 1} ${SOLE - 3} L ${x - 2} ${SOLE - 3} L ${x - 2} ${SOLE} Z`;

const bootPath = (x: number): string =>
  `M ${x - 5.5} 56 L ${x + 4.5} 56 L ${x + 3.5} 59.5 L ${x + 3.5} 66 C ${x + 6} 67 ${x + 8.5} 68.6 ${x + 10} ${SOLE} L ${x + 1.5} ${SOLE} L ${x + 1} ${SOLE - 3} L ${x - 2} ${SOLE - 3} L ${x - 2} ${SOLE} L ${x - 7.5} ${SOLE} C ${x - 7.5} 69.5 ${x - 6} 68.2 ${x - 4.5} 66.8 L ${x - 4.5} 59.5 Z`;

const shinePath = (x: number): string => `M ${x} 59 L ${x} 65.5`;

// Broken at the heel notch.
const soleLinePath = (x: number): string => `M ${x - 7} 71.2 L ${x - 2.4} 71.2 M ${x + 1.9} 71.2 L ${x + 9.4} 71.2`;

export const GoGoBootsA = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const x = context.leg.x - 1;
  const style = context.style ?? "white";

  return (
    <g>
      <path className={styles.inkFill} d={archPath(x)} />
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={bootPath(x)} />
      {style === "ink" ? (
        <>
          <path className={styles.shine} d={shinePath(x)} />
          <path className={styles.soleLine} d={soleLinePath(x)} />
        </>
      ) : null}
    </g>
  );
};
