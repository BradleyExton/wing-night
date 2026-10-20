import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { PUNCHED_POM, PUNCHED_POM_STICK } from "../../paths/popShow/index.js";
import * as styles from "./styles.js";

// pom-pom a (pop Prop), ported from the harness's pop-show.js: the high V, a
// pom in each wing. The near pom punched out front as in b, the far wing's
// thrown up behind the back, peeking over it in the bay: clipped to outside
// the body, so the bird hides its lower half and its stick. Its only style is
// white (pink on the pink body is 1.00:1).
//
// The harness paints the far pom solid in `dimmed(white)`, white 0.7 over ink,
// which is no house token: here it is that mix of the two (styles.farPom).
//
// The far pom is the harness's `cloudPom(..., 25, 26.8, 8)` on
// `stick([38,40], [30,30])`, written out.
const FAR_STICK = "M 38 40 L 30 30";

const FAR_POM = "M 30.55 27.58 C 34.71 28.16 32.96 32.52 29.55 30.07 C 32.96 32.52 29.39 35.57 27.51 31.81 C 29.39 35.57 24.82 36.6 24.89 32.4 C 24.82 36.6 20.28 35.4 22.3 31.71 C 20.28 35.4 16.83 32.22 20.33 29.89 C 16.83 32.22 15.25 27.8 19.43 27.37 C 15.25 27.8 15.9 23.15 19.8 24.72 C 15.9 23.15 18.64 19.34 21.37 22.54 C 18.64 19.34 22.83 17.24 23.76 21.34 C 22.83 17.24 27.53 17.32 26.44 21.39 C 27.53 17.32 31.64 19.58 28.79 22.68 C 31.64 19.58 34.23 23.5 30.27 24.91 C 34.23 23.5 34.71 28.16 30.55 27.58 Z";

export const PomPomA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path className={styles.outside} d={`M -20 -30 H 100 V 100 H -20 Z ${context.shapes.body}`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.stick} d={FAR_STICK} />
        <path className={`${styles.farPom} ${styles.pomEdge}`} d={FAR_POM} />
      </g>
      <path className={styles.stick} d={PUNCHED_POM_STICK} />
      <path className={`${body} ${styles.pomEdge}`} d={PUNCHED_POM} />
    </g>
  );
};
