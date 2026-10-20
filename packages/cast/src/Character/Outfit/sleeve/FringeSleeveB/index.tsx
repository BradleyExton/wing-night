import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// fringe-sleeve b (country Sleeve), ported from the harness's country-kit.js:
// the black wing's trailing edge cut into five square tabs, 2.1 wide with 1.3
// gaps, hanging straight down to one common baseline (55 at the back, 54 at
// the front), so their ends line up as a cut hem rather than drips. In the
// wing's own ink, so the fringe is part of its silhouette. Ink only.
//
// The tabs are the harness's `rect`s off the sampled trailing edge, written
// out.
const TABS =
  "M 27.15 46.42 H 29.25 V 54.99 H 27.15 Z M 30.55 48.31 H 32.65 V 54.74 H 30.55 Z M 33.95 47.26 H 36.05 V 54.5 H 33.95 Z M 37.35 47.66 H 39.45 V 54.26 H 37.35 Z M 40.75 46.06 H 42.85 V 54.01 H 40.75 Z";

export const FringeSleeveB = ({ context }: OutfitItemProps): JSX.Element => {
  const fill = styles.styleFill[context.style ?? "ink"];

  return (
    <g>
      <path className={fill} d={TABS} />
      <path className={`${fill} ${styles.inkEdge}`} d={context.shapes.wing} />
    </g>
  );
};
