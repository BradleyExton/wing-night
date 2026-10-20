import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// pom-pom c (pop Prop), ported from the harness's pop-show.js: shaken high,
// the pom thrown up over the top tail feathers at (15.5,20), clear of the
// back so it never sits on the rump like a cottontail, on a long lit stick
// from the wing. Its only style is white.
//
// The harness's `litStick([36,45], [19.5,25])` and
// `cloudPom(white, 15.5, 20, 4)`, written out.
const STICK = "M 36 45 L 19.5 25";

const POM = "M 21.09 20.39 C 25.28 20.68 23.84 25.15 20.26 22.94 C 23.84 25.15 20.49 28.44 18.35 24.82 C 20.49 28.44 16 29.79 15.79 25.59 C 16 29.79 11.39 28.9 13.15 25.08 C 11.39 28.9 7.72 25.97 11.06 23.41 C 7.72 25.97 5.84 21.68 9.98 20.96 C 5.84 21.68 6.17 16.99 10.17 18.28 C 6.17 16.99 8.63 13 11.58 16 C 8.63 13 12.67 10.61 13.88 14.64 C 12.67 10.61 17.36 10.37 16.56 14.5 C 17.36 10.37 21.62 12.34 18.99 15.62 C 21.62 12.34 24.48 16.06 20.63 17.75 C 24.48 16.06 25.28 20.68 21.09 20.39 Z";

export const PomPomC = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={styles.litStickEdge} d={STICK} />
      <path className={styles.litStickCore} d={STICK} />
      <path className={`${body} ${styles.pomEdge}`} d={POM} />
    </g>
  );
};
