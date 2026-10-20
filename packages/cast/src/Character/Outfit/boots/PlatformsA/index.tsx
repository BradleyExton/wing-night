import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// platforms a (disco Boots), ported from the harness's disco-kit.js: a white
// sole cut as a shoe, a tall heel and a lower toe joined over an arch notch
// that shows floor, under a short ink (white style) or gold upper. The sole
// is always white: the feet stand on the dark hearth, where an ink sole
// vanishes, and a team one drops into the lit-floor stage. A platform is
// built UP from the floor, never below 72.75.
//
// Drawn once per leg, about the leg's ankle (one unit behind its hip). The
// near heel runs 3 units further back, over the back toe; the far one keeps
// x−5, so the two shoes only kiss.
const solePath = (x: number, back: number): string =>
  `M ${back} 63.5 L ${x + 1} 63.5 L ${x + 8} 65.5 L ${x + 8} 72.5 L ${x + 2} 72.5 Q ${x + 0.5} 69.5 ${x - 1} 72.5 L ${back} 72.5 Z`;

const upperPath = (x: number): string =>
  `M ${x - 4} 60.5 L ${x + 2} 60.5 L ${x + 2.5} 62 C ${x + 5.5} 62.5 ${x + 8} 63.5 ${x + 8} 65.5 L ${x + 1} 63.5 L ${x - 4} 63.5 Z`;

export const PlatformsA = ({ context }: OutfitItemProps): JSX.Element | null => {
  if (context.leg === undefined) {
    return null;
  }

  const x = context.leg.x - 1;
  const style = context.style ?? "white";
  const back = context.leg.far ? x - 5 : x - 8;
  const upper = style === "white" ? styles.inkFill : styles.styleFill[style];

  return (
    <g>
      <path className={`${styles.whiteFill} ${styles.shoeEdge}`} d={solePath(x, back)} />
      <path className={`${upper} ${styles.shoeEdge}`} d={upperPath(x)} />
    </g>
  );
};
