import { useId } from "react";

import { STAGE_DISC } from "../../paths/metalShow/index.js";
import * as styles from "./styles.js";

// bolt-disc b (metal Stage), ported from the harness's metal-show.js: struck.
// One big white bolt behind the tail, its top bar out in the dark and its
// point striking down and in to the back of the disc's front rim, with two
// short ember scorch cracks running forward from where it lands. Lopsided
// where a is symmetric, white where a is ember. A showpiece: never drawn in a
// game.
//
// The bolt is the harness's `boltPath(-6.5, 55, 17, 23, true)` written out; it
// starts left of the bird's box, past the disc's back rim.
const SCORCH = ["M 9 77.5 L 15 75.5 L 21 77.5", "M 9 77.5 L 13 79.6"];

const BOLT = "M 3.36 55 L -6.5 55 L -0.38 64.2 L -5.99 64.2 L 8.8 78 L 4.38 67.88 L 9.99 67.88 Z";

// Its one style is `ink`, so the drawing reads nothing from its context.
export const BoltDiscB = (): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={STAGE_DISC} />
        </clipPath>
      </defs>
      <path className={styles.inkFill} d={STAGE_DISC} />
      <g className={styles.scorch} clipPath={`url(#${clipId})`}>
        {SCORCH.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path className={styles.mergedOutline} d={BOLT} />
      <path className={styles.whiteFill} d={BOLT} />
    </g>
  );
};
