import { STAGE_DISC } from "../../paths/metalShow/index.js";
import * as styles from "./styles.js";

// bolt-disc a (metal Stage), ported from the harness's metal-show.js: an ink
// disc with two ember lightning bolts standing at either end, behind the tail
// and past the chest, mirrored so they point down and out, in the merged ink
// outline so they stay off the hearth glow. The bird stands between them like
// a band logo. A zigzag reads by its outline at any size; every limb is 4 or
// more units across. A showpiece: never drawn in a game.
//
// The bolts are the harness's `boltPath(2, 55, 12, 21)` and its mirror at 66
// written out.
const BOLTS = [
  "M 7.04 55 L 14 55 L 9.68 63.4 L 13.64 63.4 L 3.2 76 L 6.32 66.76 L 2.36 66.76 Z",
  "M 72.96 55 L 66 55 L 70.32 63.4 L 66.36 63.4 L 76.8 76 L 73.68 66.76 L 77.64 66.76 Z"
];

// Its one style is `ink`, so the drawing reads nothing from its context.
export const BoltDiscA = (): JSX.Element => (
  <g>
    <path className={styles.inkFill} d={STAGE_DISC} />
    {BOLTS.map((d) => (
      <path key={`outline-${d}`} className={styles.mergedOutline} d={d} />
    ))}
    {BOLTS.map((d) => (
      <path key={`fill-${d}`} className={styles.emberFill} d={d} />
    ))}
  </g>
);
