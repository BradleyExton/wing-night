import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { trailingCuff } from "../../paths/countryKit/index.js";
import * as styles from "./styles.js";

// fringe-sleeve a (country Sleeve), ported from the harness's country-kit.js:
// the plain team wing trimmed in ink. A solid ink cuff band 3 units deep along
// the whole trailing edge, clipped to the wing, and five bold square-ended
// ink strands (2.2 wide, 1.6 gaps) hanging off it, swept a little back as if
// the bird is moving. Ink on orange is the one contrast that holds at 76px.
// Team only: on the ink wing it is b.
//
// The strands are the harness's `bar`s written out; the cuff follows the
// broody wing's sampled trailing edge, which is long, so it is built once
// from the ported samples.
const STRANDS =
  "M 29.26 48.12 L 27.05 56.02 L 24.93 55.43 L 27.14 47.53 Z M 32.86 49.14 L 30.92 56.07 L 28.8 55.48 L 30.74 48.54 Z M 37.66 47.58 L 35.45 55.47 L 33.33 54.88 L 35.54 46.98 Z M 41.26 48.22 L 39.26 55.35 L 37.15 54.76 L 39.14 47.63 Z M 44.66 45.62 L 42.83 52.17 L 40.71 51.58 L 42.54 45.03 Z";

const CUFF = trailingCuff();

export const FringeSleeveA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.wing} />
        </clipPath>
      </defs>
      <path className={styles.inkFill} d={STRANDS} />
      <path className={`${styles.styleFill[context.style ?? "team"]} ${styles.inkEdge}`} d={context.shapes.wing} />
      <path className={styles.inkFill} clipPath={`url(#${clipId})`} d={CUFF} />
    </g>
  );
};
