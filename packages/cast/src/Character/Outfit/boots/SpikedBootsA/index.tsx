import type { OutfitItemProps } from "../../context/index.js";
import { combatBoot } from "../../paths/metalKit/index.js";
import * as styles from "./styles.js";

// spiked-boots a (metal Boots), ported from the harness's metal-kit.js: the
// plain ink combat boot carrying ONE big horn, a fat cone 13 long and 7 tall
// at the base, all of it under the belly. Its base is buried in the ink
// shaft, its point runs out over the dark floor in front of the shin. The
// horn is the style (the team's chrome, or white); the boot is always ink.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const hornPath = (ax: number): string => `M ${ax - 3} 61.8 L ${ax + 10} 65 L ${ax - 3} 68.8 Z`;

export const SpikedBootsA = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const ankleX = context.leg.x - 1;

  return (
    <g>
      <path className={styles.inkBoot} d={combatBoot(ankleX)} />
      <path className={`${styles.styleFill[context.style ?? "team"]} ${styles.inkEdgeFineMitered}`} d={hornPath(ankleX)} />
    </g>
  );
};
