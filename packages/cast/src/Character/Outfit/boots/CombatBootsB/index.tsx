import type { OutfitItemProps } from "../../context/index.js";
import { SOLE_Y } from "../../paths/metalKit/index.js";
import * as styles from "./styles.js";

// combat-boots b (metal Boots), ported from the harness's metal-kit.js:
// platform stompers. The upper sits on a slab of a sole 5.8 deep, squared at
// both ends and left as one unbroken block in the contrasting value (the
// team's chrome under ink, ink under white), so the bird stands on two
// slabs. The silhouette change is the sole.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const upperPath = (ax: number): string =>
  `M ${ax - 5} 56 L ${ax + 3.4} 56 L ${ax + 3.4} 62 C ${ax + 7} 62 ${ax + 9.6} 63.6 ${ax + 9.6} 66.6 L ${ax - 7} 66.6 L ${ax - 5} 64 Z`;

const slabPath = (ax: number): string =>
  `M ${ax - 7.8} 66.4 L ${ax + 9.6} 66.4 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} Z`;

export const CombatBootsB = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const ankleX = context.leg.x - 1;
  const style = context.style ?? "ink";

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={upperPath(ankleX)} />
      <path className={style === "white" ? styles.inkSlab : styles.teamSlab} d={slabPath(ankleX)} />
    </g>
  );
};
