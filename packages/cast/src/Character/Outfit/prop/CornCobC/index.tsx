import { cobPaths, huskLeafPaths, type CobDims } from "../../paths/countryShow/index.js";
import * as styles from "./styles.js";

// corn-cob c (country Prop), ported from the harness's country-show.js: the
// trophy. One fat ember (yellow) cob, 13.5 across with a 9-unit blunt bullet
// tip, hoisted up behind the back like a prize, two lengthwise ink kernel rows
// down it and two big white husk leaves flaring out either side of its lower
// half. It leans back to (19.4, 23.6) so the leaves stay left of x 34 above
// the chin line.
//
// The cob is the harness's `cob` and `huskPair` (reach 0.6, flare 4.2,
// overlap 1.8), built by the countryShow helper.
const BASE = { x: 29, y: 46 };

const TIP = { x: 19.4, y: 23.6 };

const DIMS: CobDims = { w0: 9.4, wMax: 13.5, wTip: 9 };

const { outline: OUTLINE, rows: ROWS } = cobPaths(BASE, TIP, DIMS);

const [LEAF_LEFT, LEAF_RIGHT] = huskLeafPaths(BASE, TIP, DIMS, 0.6, 4.2, 1.8);

// Its one style is `white` (the husk), so the drawing reads nothing from its
// context.
export const CornCobC = (): JSX.Element => {
  return (
    <g>
      <path className={styles.cob} d={OUTLINE} />
      <path className={styles.kernelRows} d={ROWS} />
      <path className={styles.husk} d={LEAF_LEFT} />
      <path className={styles.husk} d={LEAF_RIGHT} />
    </g>
  );
};
