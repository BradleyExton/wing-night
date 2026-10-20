import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// mirror-ball-egg a (disco Prop), ported from the harness's disco-show.js: an
// egg-shaped mirror ball held low in the back pocket under the wing, its
// front stopping short of the near leg. A white egg ruled into a 3 × 4 grid of
// square facets, the back facets in shadow (two ink, two mutedWarm) and the
// front left lit, and one white glint standing off its back: the tiled grid
// plus a patch of shade is what makes a ball a mirror ball, and the middle
// stays light so it is never a light disc with a dark centre (an eye). White
// only: ink read as a grenade and gold as a pineapple.
//
// The shapes are the harness's `placeEgg(24.6, 56.4, 7, 8.9, -12)`,
// `facetGrid(LOW, 1.2)` and `glint(14.2, 51.6, 3.6)` written out. A showpiece:
// drawn in the wing's own layer, and never in a game.
const EGG =
  "M 31.45 54.94 L 31.75 56.07 L 31.92 57.2 L 31.95 58.32 L 31.84 59.41 L 31.59 60.45 L 31.2 61.43 L 30.67 62.33 L 30.01 63.13 L 29.24 63.82 L 28.38 64.38 L 27.44 64.82 L 26.45 65.11 L 25.43 65.25 L 24.39 65.23 L 23.37 65.07 L 22.39 64.75 L 21.47 64.28 L 20.62 63.68 L 19.86 62.95 L 19.21 62.1 L 18.67 61.14 L 18.24 60.11 L 17.94 59 L 17.75 57.86 L 17.69 56.68 L 17.73 55.51 L 17.88 54.35 L 18.13 53.23 L 18.47 52.16 L 18.9 51.18 L 19.39 50.29 L 19.96 49.51 L 20.58 48.85 L 21.26 48.32 L 21.99 47.93 L 22.75 47.69 L 23.54 47.6 L 24.36 47.66 L 25.2 47.87 L 26.04 48.22 L 26.87 48.7 L 27.69 49.31 L 28.48 50.04 L 29.22 50.87 L 29.9 51.79 L 30.51 52.79 L 31.03 53.85 Z";

// The two lowest back facets, which the wing shadows, then the two shaded ones.
const INK_FACETS = [
  "M 12.86 58.89 L 22.14 56.92 L 23.11 61.5 L 13.84 63.47 Z",
  "M 13.84 63.47 L 23.11 61.5 L 24.63 68.66 L 15.36 70.63 Z"
];

const SHADED_FACETS = [
  "M 11.89 54.32 L 21.16 52.35 L 22.14 56.92 L 12.86 58.89 Z",
  "M 23.11 61.5 L 28.04 60.45 L 29.56 67.61 L 24.63 68.66 Z"
];

const RULES =
  "M 19.64 45.19 L 24.63 68.66 M 24.57 44.14 L 29.56 67.61 M 11.89 54.32 L 35.36 49.33 M 12.86 58.89 L 36.34 53.91 M 13.84 63.47 L 37.31 58.48";

const GLINT = "M 14.2 48 L 15.27 50.53 L 17.8 51.6 L 15.27 52.67 L 14.2 55.2 L 13.13 52.67 L 10.6 51.6 L 13.13 50.53 Z";

export const MirrorBallEggA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={EGG} />
        </clipPath>
      </defs>
      <path className={styles.styleFill[context.style ?? "white"]} d={EGG} />
      <g clipPath={`url(#${clipId})`}>
        {INK_FACETS.map((d) => (
          <path key={d} className={styles.inkFill} d={d} />
        ))}
        {SHADED_FACETS.map((d) => (
          <path key={d} className={styles.shadedFacet} d={d} />
        ))}
        <path className={styles.facetRules} d={RULES} />
      </g>
      <path className={styles.outline} d={EGG} />
      <path className={styles.glint} d={GLINT} />
    </g>
  );
};
