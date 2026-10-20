import { useId } from "react";

import * as styles from "./styles.js";

// lava-disc a (metal Stage), ported from the harness's metal-show.js: an ink
// disc under the feet with a cracked crust, two ember fissure forks, one at
// each end, each running along the front rim, forking down once and hooking
// back up into the disc where there are no toes. The front rim stays dark
// under the feet, so blurred at 130px the orange is two forks and never one
// crescent (a grin) under the bird. A showpiece: never drawn in a game, whose
// ground is its own.
const DISC = "M 2 72.5 A 37 7 0 1 0 76 72.5 A 37 7 0 1 0 2 72.5 Z";

const CRACKS = [
  "M 29 76.8 L 24 75.5 L 14 77.5 L 5 76",
  "M 14 77.5 L 10 72.5 L 13 68.5",
  "M 24 75.5 L 19 79.5",
  "M 49 77 L 55 75.8 L 64 77.8 L 73 75.5",
  "M 64 77.8 L 68 72 L 65 68.5",
  "M 55 75.8 L 59 79.5"
];

// Its one style is `ink`, so the drawing reads nothing from its context.
export const LavaDiscA = (): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={DISC} />
        </clipPath>
      </defs>
      <path className={styles.inkFill} d={DISC} />
      <g className={styles.cracks} clipPath={`url(#${clipId})`}>
        {CRACKS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </g>
  );
};
