import type { OutfitItemProps } from "../../context/index.js";
import { SKATE_WHEEL, skatePlate, skateTruck } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// roller-skates b (disco Boots), ported from the harness's disco-kit.js: the
// roller-girl boot. The skate boot runs knee-high from under the body, with a
// broad ember band round the shin below the thigh, a warm stripe between the
// boot and its white wheels that never touches the team belly. a is team
// wheels; b is an ember-banded boot.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const bootPath = (x: number): string =>
  `M ${x - 3.4} 55 L ${x + 3.6} 55 L ${x + 3} 63 C ${x + 5.5} 63.5 ${x + 7.5} 65 ${x + 7.5} 67 L ${x - 7} 67 C ${x - 6} 64 ${x - 3.8} 61 ${x - 3.4} 55 Z`;

const bandPath = (x: number): string => `M ${x - 3.6} 60 L ${x + 3.8} 60 L ${x + 3.4} 64 L ${x - 3.8} 64 Z`;

export const RollerSkatesB = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const x = context.leg.x - 1;
  const wheel = `${styles.whiteFill} ${styles.skateEdge}`;

  return (
    <g>
      <path className={styles.inkFill} d={skatePlate(x)} />
      <path className={styles.inkFill} d={skateTruck(x)} />
      <circle className={wheel} cx={x + SKATE_WHEEL.back} cy={SKATE_WHEEL.cy} r={SKATE_WHEEL.r} />
      <circle className={wheel} cx={x + SKATE_WHEEL.front} cy={SKATE_WHEEL.cy} r={SKATE_WHEEL.r} />
      <path className={`${styles.styleFill[context.style ?? "white"]} ${styles.skateEdge}`} d={bootPath(x)} />
      <path className={styles.shinBand} d={bandPath(x)} />
    </g>
  );
};
