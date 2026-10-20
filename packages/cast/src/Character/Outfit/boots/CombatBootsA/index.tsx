import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// combat-boots a (metal Boots), ported from the harness's metal-kit.js:
// chunky boots round the leg with a big round toe and a lug sole in the
// contrasting value (the team's chrome under ink, ink under white), so the
// bird stands on the floor instead of melting into it. The shaft runs up to
// the thigh so no orange shin shows under it, and the sole stops at 72.2,
// above the 72.75 floor: `CHARACTER_FOOT` does not move.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip).
const SOLE_Y = 72.2;

const bootPath = (ankleX: number): string =>
  `M ${ankleX - 5} 56 L ${ankleX + 3.4} 56 L ${ankleX + 3.4} 64.6 C ${ankleX + 7} 64.6 ${ankleX + 9.6} 66.4 ${ankleX + 9.6} 69.4 L ${ankleX + 9.6} ${SOLE_Y} L ${ankleX - 7.8} ${SOLE_Y} L ${ankleX - 7.8} 68.8 L ${ankleX - 5} 67.6 Z`;

const solePath = (ankleX: number): string =>
  `M ${ankleX - 7.8} 69 L ${ankleX + 9.6} 69 L ${ankleX + 9.6} ${SOLE_Y} L ${ankleX - 7.8} ${SOLE_Y} Z`;

export const CombatBootsA = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const ankleX = context.leg.x - 1;
  const style = context.style ?? "ink";

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={bootPath(ankleX)} />
      <path className={style === "white" ? styles.inkSole : styles.teamSole} d={solePath(ankleX)} />
    </g>
  );
};
