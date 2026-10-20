import { STAGE_DISC } from "../../paths/metalShow/index.js";
import * as styles from "./styles.js";

// lava-disc c (metal Stage), ported from the harness's metal-show.js: an ink
// disc with flame tongues licking up behind the bird at either end, each with
// S-curved sides and twin tips, leaning alternately and at three heights so
// they flicker rather than stand like candy-corn cones. No ember along the
// front rim: that was the crescent under the bird this unit calls a grin. A
// showpiece: never drawn in a game, whose ground is its own.
//
// The tongues are the harness's `flame(7, 57.5, 5, -2)`, `flame(17.5, 55,
// 6.5, 1.5)` and `flame(66, 56, 6.5, -1.5)` written out, under the disc.
const FLAMES = [
  "M 2 70 C 0 68.5 3 62.5 4 57.5 C 8 63.5 8.5 64.5 9.75 61.5 C 12.5 66.5 13.5 69.5 12 70 Z",
  "M 11 70 C 9 66 12 60 18 55 C 18.5 61 19 62 21.08 59 C 24.5 64 25.5 67 24 70 Z",
  "M 59.5 70 C 57.5 67 60.5 61 63.5 56 C 67 62 67.5 63 69.58 60 C 73 65 74 68 72.5 70 Z"
];

// Its one style is `ink`, so the drawing reads nothing from its context.
export const LavaDiscC = (): JSX.Element => (
  <g>
    {FLAMES.map((d) => (
      <path key={d} className={styles.flame} d={d} />
    ))}
    <path className={styles.inkFill} d={STAGE_DISC} />
  </g>
);
