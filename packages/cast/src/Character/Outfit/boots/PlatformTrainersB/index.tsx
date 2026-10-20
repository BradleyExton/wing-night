import type { OutfitItemProps } from "../../context/index.js";
import { SOLE } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// platform-trainers b (pop Boots), ported from the harness's pop-kit.js: the
// Buffalo stack. A high-top upper from under the body's edge (y 56.5) to
// y 65.5 with the vamp curving forward into a swollen toe box, a 2u ink band,
// then a white platform to the floor sticking out 1u past the upper at both
// ends with a shallow arch under it. The platform is white in every style.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const platformPath = (x: number): string =>
  `M ${x - 7.6} 67.5 L ${x + 8.1} 67.5 Q ${x + 9.6} 67.5 ${x + 9.6} 69 L ${x + 9.6} ${SOLE} L ${x + 4.6} ${SOLE} Q ${x + 1.6} ${SOLE - 1.5} ${x - 1.4} ${SOLE} L ${x - 7.6} ${SOLE} Z`;

const upperPath = (x: number): string =>
  `M ${x - 6.6} 66 C ${x - 6.6} 62.5 ${x - 4.4} 60 ${x - 3.8} 56.5 Q ${x - 0.5} 55 ${x + 3} 56.5 L ${x + 3.3} 58.4 C ${x + 3.6} 60.2 ${x + 4.4} 61 ${x + 5.6} 61 Q ${x + 8.6} 61 ${x + 8.6} 64 L ${x + 8.6} 66 Z`;

const bandPath = (x: number): string =>
  `M ${x - 7.6} 65.5 L ${x + 9.6} 65.5 L ${x + 9.6} 67.5 L ${x - 7.6} 67.5 Z`;

export const PlatformTrainersB = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const x = context.leg.x - 1;

  return (
    <g>
      <path className={`${styles.whiteFill} ${styles.inkEdge}`} d={platformPath(x)} />
      <path className={`${styles.styleFill[context.style ?? "white"]} ${styles.inkEdge}`} d={upperPath(x)} />
      <path className={styles.inkFill} d={bandPath(x)} />
    </g>
  );
};
