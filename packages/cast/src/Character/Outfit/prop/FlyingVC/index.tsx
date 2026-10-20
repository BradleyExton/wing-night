import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// flying-v c (metal Prop), ported from the harness's metal-show.js: variant
// a's guitar hoisted, lifted 8.5 up the back and stood steeper with a shorter
// neck, the way a player raises the axe at the end of a song. The V sits on
// the wing instead of at the hip, so both legs stand clear under it, and the
// neck rises over the dorsal spikes. White or gold, never ink.
//
// The shapes are the harness's `guitarV({ ...SLUNG, J: [25.5, 37], deg: 74,
// n: 23 })` written out.
const SHAPES = [
  "M 27.79 37.38 L 21.18 14.31 L 17.14 15.47 L 23.76 38.54 Z",
  "M 21.61 14.71 L 20.4 7.25 L 11.53 8.24 L 16.7 16.12 Z",
  "M 24.81 34.6 L 29.4 34.63 L 41.31 52.23 L 35.1 50.89 L 27.57 44.21 L 24.72 53.87 L 20.16 58.3 L 20.94 37.06 Z"
];

const PICKUP_BAR = "M 29.57 38.12 L 30.23 40.43 L 23.31 42.41 L 22.65 40.11 Z";

const NUT_BAR = "M 21.12 14.12 L 21.68 16.04 L 17.64 17.2 L 17.09 15.28 Z";

export const FlyingVC = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      {SHAPES.map((d) => (
        <path key={`outline-${d}`} className={styles.mergedOutline} d={d} />
      ))}
      {SHAPES.map((d) => (
        <path key={`fill-${d}`} className={body} d={d} />
      ))}
      <path className={styles.inkFill} d={PICKUP_BAR} />
      <path className={styles.inkFill} d={NUT_BAR} />
    </g>
  );
};
