import { useId } from "react";

import * as styles from "./styles.js";

// lava-disc b (metal Stage), ported from the harness's metal-show.js: rock in
// a lava lake, the value of a turned inside out. A wide ember pool in the
// merged ink outline (so it stands off the hearth glow rather than bleeding
// into it), and the bird on a slab of ink crust cut in a few straight facets,
// running from the pool's back rim to its front rim so the ember is two pools
// at the ends: never a ring round a dark centre (an eye) nor a crescent along
// the front (a grin). Two short ember cracks run in across the slab's face. A
// showpiece: never drawn in a game, whose ground is its own.
//
// `ellipsePath(39, 72.5, 39, 6.2)`, the pool, also clips the slab.
const POOL = "M 0 72.5 A 39 6.2 0 1 0 78 72.5 A 39 6.2 0 1 0 0 72.5 Z";

const SLAB = "M 19 80 L 15 75.5 L 20.5 70 L 22 64 L 57 64 L 59.5 69 L 65 73.5 L 61 80 Z";

const CRACKS = ["M 15.5 77.5 L 23 75 L 26 78", "M 64 76 L 58 74.5"];

// Its one style is `ink`, so the drawing reads nothing from its context.
export const LavaDiscB = (): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={POOL} />
        </clipPath>
      </defs>
      <path className={styles.mergedOutline} d={POOL} />
      <path className={styles.emberFill} d={POOL} />
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.inkFill} d={SLAB} />
        <g className={styles.cracks}>
          {CRACKS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
    </g>
  );
};
