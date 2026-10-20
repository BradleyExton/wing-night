import type { OutfitItemProps } from "../../context/index.js";
import { SOLE } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// platform-trainers a (pop Boots), ported from the harness's pop-kit.js: a
// chunky high-top whose top tucks under the body's edge (y 56.5), so no
// ankle shows above it, on a 5u warm-grey platform built up from the floor.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const upperPath = (x: number): string =>
  `M ${x - 6} 67.5 L ${x - 5} 56.5 Q ${x - 1} 55 ${x + 3.5} 56.5 L ${x + 4} 62 C ${x + 6.5} 62.5 ${x + 8.6} 63.5 ${x + 8.6} 67.5 Z`;

const solePath = (x: number): string =>
  `M ${x - 7.5} 66.5 L ${x + 8.4} 66.5 C ${x + 9.3} 67.5 ${x + 9.3} 70.5 ${x + 8.4} ${SOLE} L ${x - 7.5} ${SOLE} Z`;

export const PlatformTrainersA = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const x = context.leg.x - 1;

  return (
    <g>
      <path className={`${styles.styleFill[context.style ?? "white"]} ${styles.inkEdge}`} d={upperPath(x)} />
      <path className={styles.platform} d={solePath(x)} />
    </g>
  );
};
