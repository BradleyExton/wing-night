import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// flying-v a (metal Prop), ported from the harness's metal-show.js: the
// Flying V slung across the back, its neck rising over the tail and its body
// down behind the wing, the way a player wears one. A deep notch between two
// chunky prongs, a short neck and a flared blade headstock, with an ink pickup
// bar across the body and an ink nut at the headstock: two dark cross-strokes
// in a white shape say instrument, not arrow. White or gold, never ink (an
// ink guitar read as a plank).
//
// The shapes are the harness's `guitarV(SLUNG)` written out. It is a
// showpiece: drawn in the wing's own layer, so it turns about the shoulder
// with the wing, and never in a game.
const SHAPES = [
  "M 29.83 45.56 L 18.44 19.98 L 14.6 21.69 L 25.99 47.27 Z",
  "M 18.91 20.31 L 16.69 13.1 L 8.04 15.31 L 14.25 22.39 Z",
  "M 26.48 43.22 L 31.03 42.61 L 45.28 58.38 L 38.94 57.92 L 30.55 52.35 L 29.07 62.31 L 25.18 67.33 L 22.99 46.19 Z"
];

const PICKUP_BAR = "M 31.68 46.05 L 32.66 48.24 L 26.08 51.17 L 25.11 48.97 Z";

const NUT_BAR = "M 18.36 19.8 L 19.17 21.62 L 15.33 23.33 L 14.52 21.51 Z";

export const FlyingVA = ({ context }: OutfitItemProps): JSX.Element => {
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
