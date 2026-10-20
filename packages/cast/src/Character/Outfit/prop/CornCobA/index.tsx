import { cobPaths, huskLeafPaths, type CobDims } from "../../paths/countryShow/index.js";
import * as styles from "./styles.js";

// corn-cob a (country Prop), ported from the harness's country-show.js: the
// harvest pair. Two ember (yellow) cobs, 8 to 10.5 across with blunt 7-unit
// tips, raised in a V behind the back from one grip at the wing tip, each with
// two lengthwise ink kernel rows and its own two white husk leaves hugging its
// sides: the corn emoji. The upright cob leans back so its right-hand leaf
// stays left of x 34 above the chin line. Lengthwise rows only: cross lines on
// a tapered oval are a grenade.
//
// The cobs are the harness's `cob` and `huskPair` (reach 0.62, flare 4,
// overlap 1.8), built by the countryShow helper since an outline is a few
// hundred points.
const DIMS: CobDims = { w0: 8, wMax: 10.5, wTip: 7 };

const ear = (p0: { x: number; y: number }, p1: { x: number; y: number }) => ({
  ...cobPaths(p0, p1, DIMS),
  leaves: huskLeafPaths(p0, p1, DIMS, 0.62, 4, 1.8)
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
