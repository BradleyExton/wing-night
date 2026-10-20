import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// spiked-cuff b (metal Tail), ported from the harness's metal-kit.js: steel
// spearheads capping each of the spiky tail's three blades, chrome points
// 5.6 past the blade's own tip, each ringed by an ink collar. The tail gets
// longer and sharper; the collar is the cuff.
//
// The heads and collars are the harness's per-blade frame written out,
// bottom blade first, as it draws them.
const BLADES = [
  {
    head: "M 7.73 42.17 L -3.58 46.41 L 8.23 48.95 Z",
    collar: "M 10.34 42.17 L 7.15 42.41 L 7.62 48.79 L 10.81 48.56 Z"
  },
  {
    head: "M 6.84 25.09 L -5.19 23.9 L 4.29 31.4 Z",
    collar: "M 9.17 26.25 L 6.21 25.05 L 3.81 30.99 L 6.78 32.19 Z"
  },
  {
    head: "M 13.7 10.61 L 2.91 5.18 L 9.06 15.58 Z",
    collar: "M 15.47 12.54 L 13.13 10.35 L 8.76 15.03 L 11.1 17.21 Z"
  }
];

export const SpikedCuffB = ({ context }: OutfitItemProps): JSX.Element => {
  const steel = `${styles.styleFill[context.style ?? "team"]} ${styles.inkEdgeMitered}`;

  return (
    <g>
      {BLADES.map(({ head, collar }) => (
        <g key={head}>
          <path className={steel} d={head} />
          <path className={styles.collar} d={collar} />
        </g>
      ))}
    </g>
  );
};
