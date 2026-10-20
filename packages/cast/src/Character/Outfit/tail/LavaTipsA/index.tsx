import * as styles from "./styles.js";

// lava-tips a (metal Tail), ported from the harness's metal-kit.js: a tail of
// red-hot steel. Every blade's outer 58% is ember, from a wavy heat line out
// to a tip run 2 units past the blade's own, so the tail ends in three long,
// even, glowing points. One 4-wide ink underlay edges all three, then each
// ember tip on top.
//
// The tips are the harness's `bladeFrame` dips written out, top blade first.
const TIPS = [
  "M 22.05 19.64 L 5.54 7.63 L 18.63 23.3 Q 21.67 24.44 20.34 21.47 Q 19.01 18.5 22.05 19.64 Z",
  "M 17.66 29.86 L -1.85 25.25 L 15.4 35.48 Q 18.75 35.2 16.53 32.67 Q 14.31 30.14 17.66 29.86 Z",
  "M 17.45 42.06 L 0.01 46.15 L 17.87 47.62 Q 20.75 46.01 17.66 44.84 Q 14.57 43.67 17.45 42.06 Z"
];

// Its one style is `ink` and nothing places it, so it reads no context.
export const LavaTipsA = (): JSX.Element => {
  return (
    <g>
      <path className={styles.underlay} d={TIPS.join(" ")} />
      {TIPS.map((d) => (
        <path key={d} className={styles.emberFill} d={d} />
      ))}
    </g>
  );
};
