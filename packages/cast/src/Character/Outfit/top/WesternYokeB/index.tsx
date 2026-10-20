import type { OutfitItemProps } from "../../context/index.js";
import { frontEdge } from "../../paths/countryKit/index.js";
import * as styles from "./styles.js";

// western-yoke b (country Top), ported from the harness's country-kit.js: a
// square yoke and a bolo tie. The band's lower edge is straight, and the
// western shirt is told by the tie instead: a white diamond slide at the
// yoke's edge and two ink cords down the chest. Ink only (a white yoke split
// by the slide read as angry eyes).
//
// The band starts at y 36 at the highest (the drawn neck hides anything
// above it) and runs down the body's front edge, so it is built here. The
// cords are the harness's `bar`s and `rect`s written out.
const CORDS =
  "M 56.9 46.03 L 56.45 55.02 L 55.05 54.95 L 55.5 45.97 Z M 58.5 45.97 L 58.95 54.95 L 57.55 55.02 L 57.1 46.03 Z M 55.2 54 H 56.9 V 56.4 H 55.2 Z M 57.1 54 H 58.8 V 56.4 H 57.1 Z";

const SLIDE = "M 57 39.8 L 60.8 44.4 L 57 49 L 53.2 44.4 Z";

export const WesternYokeB = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "ink";
  const y0 = Math.max(context.head.shoulders, 36);
  const band = `M 50.6 ${y0} ${frontEdge(y0, 42)} L 50.6 42 Z`;

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={band} />
      <path className={styles.inkFill} d={CORDS} />
      <path className={`${style === "ink" ? styles.whiteFill : styles.inkFill} ${styles.slideEdge}`} d={SLIDE} />
    </g>
  );
};
