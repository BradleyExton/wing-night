import type { OutfitItemProps } from "../../context/index.js";
import { SOLE_Y } from "../../paths/metalKit/index.js";
import * as styles from "./styles.js";

// combat-boots c (metal Boots), ported from the harness's metal-kit.js: the
// steel-toe boot. A mitered ink boot with an angular toe and ONE big bare-steel
// cap, 9.2 long and 6.8 tall, wrapped over the instep and down the sloped toe:
// the team's chrome with a 1.5 ink edge. The shaft keeps the boot dark under
// the belly; the light shows only at the toe.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const bootPath = (ax: number): string =>
  `M ${ax - 5} 56 L ${ax + 3.4} 56 L ${ax + 3.4} 63.6 L ${ax + 5.4} 63.6 L ${ax + 9.8} 67 L ${ax + 9.8} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} L ${ax - 7.8} 67.6 L ${ax - 5} 66.6 Z`;

const toePath = (ax: number): string =>
  `M ${ax + 0.6} 63.6 L ${ax + 5.4} 63.6 L ${ax + 9.8} 67 L ${ax + 9.8} 70.4 L ${ax + 0.6} 70.4 Z`;

export const CombatBootsC = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const ankleX = context.leg.x - 1;

  return (
    <g>
      <path className={`${styles.styleFill[context.style ?? "ink"]} ${styles.inkEdgeMitered}`} d={bootPath(ankleX)} />
      <path className={styles.steelToe} d={toePath(ankleX)} />
    </g>
  );
};
