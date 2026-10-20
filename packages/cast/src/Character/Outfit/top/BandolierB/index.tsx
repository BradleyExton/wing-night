import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// bandolier b (metal Top), ported from the harness's metal-kit.js: the slung
// belt. One long ink bullet belt worn across the whole bird, from under the
// chin (62,39) down over the wing to the lower back (22,57.5), carrying four
// long brass cartridges that stand proud of both edges. It paints over the
// sleeve as a real bandolier sits over the arm; the body clip ends it.
//
// The strap is the harness's `longStrapPath(SLUNG, top)` written out: run 12
// past each end, 3.2 either side, and cut level at `max(head.shoulders, 37)`,
// which is 37 under both heads, so it is one shape.
const STRAP = "M 58.7 37 L 9.77 59.63 L 12.45 65.44 L 73.95 37 Z";

// `strapBullets`: a 9.6 × 3.6 cartridge, point out along the strap's upward
// normal, at 0.18, 0.4, 0.62 and 0.84 of the way down it.
const CARTRIDGE = "M -4.8 -1.8 L 2.8 -1.8 L 4.8 0 L 2.8 1.8 L -4.8 1.8 Z";

const CARTRIDGE_PLACES = [
  "translate(54.8 42.33) rotate(-114.82)",
  "translate(46 46.4) rotate(-114.82)",
  "translate(37.2 50.47) rotate(-114.82)",
  "translate(28.4 54.54) rotate(-114.82)"
];

export const BandolierB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.inkFill} d={STRAP} />
        {CARTRIDGE_PLACES.map((transform) => (
          <path key={transform} className={styles.cartridge} transform={transform} d={CARTRIDGE} />
        ))}
      </g>
    </g>
  );
};
