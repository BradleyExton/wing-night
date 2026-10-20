import type { OutfitItemProps } from "../../context/index.js";
import { SKATE_WHEEL, skatePlate, skateTruck } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// roller-skates a (disco Boots), ported from the harness's disco-kit.js: the
// classic high-top. A light roller boot on an ink plate that hides the whole
// foot, a truck block between two big team wheels (white in the ink style).
// Wheels are solid discs, no hub (a light disc with a dark centre is an eye),
// and never pass 72.75.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const bootPath = (x: number): string =>
  `M ${x - 4.5} 59.5 L ${x + 2} 59.5 L ${x + 2.5} 62.5 C ${x + 5.5} 63 ${x + 7.5} 64.5 ${x + 7.5} 67 L ${x - 7} 67 C ${x - 7.2} 64 ${x - 5.5} 61.5 ${x - 4.5} 59.5 Z`;

export const RollerSkatesA = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const x = context.leg.x - 1;
  const style = context.style ?? "white";
  const wheel = `${style === "ink" ? styles.whiteFill : styles.teamFill} ${styles.skateEdge}`;

  return (
    <g>
      <path className={styles.inkFill} d={skatePlate(x)} />
      <path className={styles.inkFill} d={skateTruck(x)} />
      <circle className={wheel} cx={x + SKATE_WHEEL.back} cy={SKATE_WHEEL.cy} r={SKATE_WHEEL.r} />
      <circle className={wheel} cx={x + SKATE_WHEEL.front} cy={SKATE_WHEEL.cy} r={SKATE_WHEEL.r} />
      <path className={`${styles.styleFill[style]} ${styles.skateEdge}`} d={bootPath(x)} />
    </g>
  );
};
