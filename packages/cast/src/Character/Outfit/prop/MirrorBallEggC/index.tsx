import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// mirror-ball-egg c (disco Prop), ported from the harness's disco-show.js: the
// same value-faceted white egg as a foil balloon, floating up in the dark
// pocket between the upper tail sickle and the head on a 2-unit ink string
// tied at the wing tip, a knot under it and one big glint off its back-top.
// On the dance extremes it swings up behind the head, which is allowed (it
// paints under the head). Its back facets are all mutedWarm, never ink, so its
// rim never merges into the dark backdrop as a half-moon. No rigid handle: on
// a cane the gridded egg read as a tennis racket.
//
// The shapes are the harness's `placeEgg(20.2, 17.6, 7.2, 8.6, -6)`,
// `facetGrid(HIGH, 1.24, false)` and `glint(12.6, 10.4, 3)` written out.
const STRING = "M 21.4 27.72 C 17.4 36.12 26.4 44.12 22.6 53.2";

const KNOT = "M 19.6 28.52 L 23.2 28.52 L 21.4 25.62 Z";

const EGG =
  "M 27.36 16.85 L 27.54 17.96 L 27.58 19.06 L 27.49 20.14 L 27.25 21.18 L 26.88 22.16 L 26.36 23.07 L 25.72 23.88 L 24.96 24.59 L 24.1 25.18 L 23.15 25.64 L 22.15 25.97 L 21.1 26.15 L 20.04 26.19 L 18.98 26.08 L 17.96 25.82 L 17 25.43 L 16.1 24.89 L 15.31 24.23 L 14.62 23.45 L 14.05 22.57 L 13.6 21.6 L 13.28 20.57 L 13.1 19.48 L 13.04 18.35 L 13.1 17.22 L 13.28 16.09 L 13.57 14.99 L 13.95 13.93 L 14.42 12.94 L 14.97 12.04 L 15.58 11.23 L 16.24 10.53 L 16.96 9.95 L 17.71 9.51 L 18.49 9.21 L 19.3 9.05 L 20.12 9.03 L 20.95 9.17 L 21.78 9.44 L 22.6 9.86 L 23.4 10.4 L 24.16 11.07 L 24.88 11.84 L 25.55 12.71 L 26.14 13.67 L 26.65 14.68 L 27.06 15.75 Z";

const SHADED_FACETS = [
  "M 8.27 18.85 L 17.61 17.87 L 18.12 22.68 L 8.77 23.66 Z",
  "M 8.77 23.66 L 18.12 22.68 L 18.86 29.81 L 9.52 30.79 Z",
  "M 7.76 14.04 L 17.1 13.06 L 17.61 17.87 L 8.27 18.85 Z",
  "M 18.12 22.68 L 23.3 22.14 L 24.04 29.26 L 18.86 29.81 Z"
];

const RULES =
  "M 16.36 5.94 L 18.86 29.81 M 21.54 5.39 L 24.04 29.26 M 7.76 14.04 L 31.63 11.54 M 8.27 18.85 L 32.13 16.35 M 8.77 23.66 L 32.64 21.16";

const GLINT = "M 12.6 7.4 L 13.49 9.51 L 15.6 10.4 L 13.49 11.29 L 12.6 13.4 L 11.71 11.29 L 9.6 10.4 L 11.71 9.51 Z";

export const MirrorBallEggC = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <path className={styles.string} d={STRING} />
      <path className={styles.inkFill} d={KNOT} />
      <defs>
        <clipPath id={clipId}>
          <path d={EGG} />
        </clipPath>
      </defs>
      <path className={styles.styleFill[context.style ?? "white"]} d={EGG} />
      <g clipPath={`url(#${clipId})`}>
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
