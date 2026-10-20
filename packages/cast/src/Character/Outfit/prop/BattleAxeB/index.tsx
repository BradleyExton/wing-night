import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// battle-axe b (metal Prop), ported from the harness's metal-show.js: a
// bearded axe swung back, one big bit on a longer bone haft slung diagonally
// across the back like the Flying V, the knuckle down at the wing and the head
// up over the tail root, the blade facing up into the dark with its beard
// hooking down the haft and a short back spike on the tail side. Lopsided
// where a is symmetric. The bit and spike take the style; the bone stays
// white. White or gold, never ink.
//
// The shapes are the harness's `battleAxe(...)` written out: the haft, its two
// knuckle circles drawn as arc paths, the bit, then the spike.
const BONE = [
  "M 13.83 16.3 L 32.37 45.99 L 29.66 47.68 L 11.11 18 Z",
  "M 30.79 46.78 A 2.2 2.2 0 1 0 35.19 46.78 A 2.2 2.2 0 1 0 30.79 46.78 Z",
  "M 27.91 48.58 A 2.2 2.2 0 1 0 32.31 48.58 A 2.2 2.2 0 1 0 27.91 48.58 Z"
];

const HEAD = [
  "M 13.85 17.47 Q 18.57 15.11 22.01 8.83 Q 32.21 13.07 31.55 24.1 Q 20.95 18.93 16.76 22.13 Z",
  "M 13.16 18.25 L 9.66 23.03 L 15.49 21.99 Z"
];

export const BattleAxeB = ({ context }: OutfitItemProps): JSX.Element => {
  const blade = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      {[...BONE, ...HEAD].map((d) => (
        <path key={`outline-${d}`} className={styles.mergedOutline} d={d} />
      ))}
      {BONE.map((d) => (
        <path key={`fill-${d}`} className={styles.whiteFill} d={d} />
      ))}
      {HEAD.map((d) => (
        <path key={`fill-${d}`} className={blade} d={d} />
      ))}
    </g>
  );
};
