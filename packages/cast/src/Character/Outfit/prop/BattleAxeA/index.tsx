import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// battle-axe a (metal Prop), ported from the harness's metal-show.js: a
// double-bit labrys hafted on a chicken drumstick bone, stood upright behind
// the wing and tilted 8° back, two crescent bits in the dark above the back
// and a short spike capping the haft. It reads by outline, a crescent blade on
// a stick. The bits and spike take the style; the haft and its two-lobed
// knuckle stay white bone, so even a gold axe keeps its wing-night joke. White
// or gold, never ink (ink bits vanish in the dark above the back).
//
// The shapes are the harness's `battleAxe(...)` written out: the haft, its two
// knuckle circles drawn as arc paths, the two bits, then the spike.
const BONE = [
  "M 22.45 16.29 L 26.48 45 L 23.31 45.45 L 19.28 16.73 Z",
  "M 24.52 45.98 A 2.2 2.2 0 1 0 28.92 45.98 A 2.2 2.2 0 1 0 24.52 45.98 Z",
  "M 21.15 46.45 A 2.2 2.2 0 1 0 25.55 46.45 A 2.2 2.2 0 1 0 21.15 46.45 Z"
];

const HEAD = [
  "M 19.24 12.19 Q 16.34 13.11 11.96 10.69 Q 8.32 19.28 14.19 26.54 Q 17.73 23.01 20.78 23.09 Z",
  "M 21.22 11.91 Q 24.27 11.99 27.81 8.46 Q 33.68 15.72 30.04 24.31 Q 25.66 21.89 22.76 22.81 Z",
  "M 23.38 17.17 L 20.3 12.55 L 18.62 17.83 Z"
];

export const BattleAxeA = ({ context }: OutfitItemProps): JSX.Element => {
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
