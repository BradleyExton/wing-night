import { cobPaths, huskSheathPaths, type CobDims } from "../../paths/countryShow/index.js";
import * as styles from "./styles.js";

// corn-cob a (country Prop): the harvest pair. Two cobs raised in a V behind
// the back from one grip at the wing tip, each in its husk the way the corn
// emoji is: a solid white sheath of two leaves wrapping the lower two thirds,
// split down the middle and peeling out into two pointed tips, and the gold
// cob's knobbly bullet top standing out of it with two lengthwise ink kernel
// rows. The upright cob leans back so its right-hand leaf stays left of x 34
// above the chin line.
//
// Redrawn in run 5 (docs/bird-wardrobe-build-plan.md): Gate 1's ember cobs
// sat over a country bird's own orange and sank into it, leaving four thin
// white husk slivers that read as white puffs at 76px. The cob is gold now,
// the house's own accent, outlined in ink, and where it sits on the orange the
// white sheath carries the shape; the axes, and so the reach, are Gate 1's.
const DIMS: CobDims = { w0: 9, wMax: 12, wTip: 8.5 };

const SHEATH = { reach: 0.62, split: 0.25, flare: 1.8 };

const ear = (p0: { x: number; y: number }, p1: { x: number; y: number }) => ({
  ...cobPaths(p0, p1, DIMS),
  leaves: huskSheathPaths(p0, p1, DIMS, SHEATH)
});

const EARS = [ear({ x: 29, y: 46 }, { x: 7.8, y: 36 }), ear({ x: 29.6, y: 46 }, { x: 21.8, y: 23 })];

// Its one style is `white` (the husk), so the drawing reads nothing from its
// context.
export const CornCobA = (): JSX.Element => {
  return (
    <g>
      {EARS.map(({ outline, rows, leaves }) => (
        <g key={outline}>
          <path className={styles.cob} d={outline} />
          <path className={styles.kernelRows} d={rows} />
          <path className={styles.husk} d={leaves[0]} />
          <path className={styles.husk} d={leaves[1]} />
        </g>
      ))}
    </g>
  );
};
