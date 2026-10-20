import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// drumsticks a (metal Prop), ported from the harness's metal-show.js: two
// chicken drumsticks crossed under the belly as a drummer's sticks, a flat X
// with the knuckles up at the wing and the chest and the meat hanging out past
// the legs. White bone and two-lobed knuckles; the meat is ember (a buffalo
// drumstick on wing night), or gold in the gold style, where the style is
// otherwise unused. The merged ink outline keeps the ember meat off the orange
// feet: never thin it.
//
// The shapes are the harness's two `drumstickShapes(...)` written out, each a
// bone, two knuckle circles drawn as arc paths, and the meat.
const STICKS = [
  { d: "M 32.6 41.66 L 55.46 50.32 L 54.5 52.85 L 31.64 44.19 Z", meat: false },
  { d: "M 30.66 41.49 A 1.9 1.9 0 1 0 34.46 41.49 A 1.9 1.9 0 1 0 30.66 41.49 Z", meat: false },
  { d: "M 29.6 44.29 A 1.9 1.9 0 1 0 33.4 44.29 A 1.9 1.9 0 1 0 29.6 44.29 Z", meat: false },
  { d: "M 53.59 49.61 C 58.43 48.34 64.68 51.1 64 55 C 61.93 58.37 55.41 56.3 52.63 52.14 Z", meat: true },
  { d: "M 48.32 44.17 L 24.12 52.82 L 23.21 50.28 L 47.42 41.63 Z", meat: false },
  { d: "M 46.57 44.28 A 1.9 1.9 0 1 0 50.37 44.28 A 1.9 1.9 0 1 0 46.57 44.28 Z", meat: false },
  { d: "M 45.56 41.46 A 1.9 1.9 0 1 0 49.36 41.46 A 1.9 1.9 0 1 0 45.56 41.46 Z", meat: false },
  { d: "M 26 52.15 C 22.94 56.33 16 58.41 14 55 C 13.39 51.09 20.08 48.31 25.1 49.6 Z", meat: true }
];

export const DrumsticksA = ({ context }: OutfitItemProps): JSX.Element => {
  const meat = context.style === "gold" ? styles.goldFill : styles.emberFill;

  return (
    <g>
      {STICKS.map(({ d }) => (
        <path key={`outline-${d}`} className={styles.mergedOutline} d={d} />
      ))}
      {STICKS.map(({ d, meat: isMeat }) => (
        <path key={`fill-${d}`} className={isMeat ? meat : styles.whiteFill} d={d} />
      ))}
    </g>
  );
};
