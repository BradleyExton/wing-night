import * as styles from "./styles.js";

// acoustic-guitar b (country Prop), ported from the harness's country-show.js:
// the troubadour. Slung across the back, the body on the rear of the bird
// under the wing and the long neck rising up and back over the tail to a
// headstock against the hearth: a guitar carried to the gig. White only since
// Gate 1 (the ink body was a black frying pan).
//
// The shapes are the harness's `neckAndHead((23,45.4), (14,35))` (headstock
// 5.2 long, 5.4 wide) and `guitarBody` (bouts 8 at (32,56.6) and 5.6 at
// (24.6,47.8), waist 0.48) written out: an ink casing pass under each white
// part, so the neck shows on the orange and on the dark hearth.
const NECK = "M 23 45.4 L 13.67 34.62";

const HEADSTOCK = "M 16.04 33.23 L 13.02 28.97 L 8.18 33.16 L 11.96 36.77 Z";

// The tuning peg nubs either side of the headstock.
const PEGS = [{ cx: 14.93, cy: 30.42 }, { cx: 9.33, cy: 35.26 }];

// The figure-eight body: lower bout, upper bout and the waist between them.
const LOWER_BOUT = { cx: 32, cy: 56.6, r: 8 };

const UPPER_BOUT = { cx: 24.6, cy: 47.8, r: 5.6 };

const WAIST = "M 22.54 49.53 L 29.06 59.07 L 34.94 54.13 L 26.66 46.07 Z";

// Its one style is `white`, so the drawing reads nothing from its context.
export const AcousticGuitarB = (): JSX.Element => {
  return (
    <g>
      {PEGS.map((p) => (
        <circle key={`casing-${p.cx}`} className={styles.inkFill} cx={p.cx} cy={p.cy} r={2.4} />
      ))}
      <path className={styles.neckCasing} d={NECK} />
      <path className={styles.headCasing} d={HEADSTOCK} />
      <path className={styles.neck} d={NECK} />
      <path className={styles.head} d={HEADSTOCK} />
      {PEGS.map((p) => (
        <circle key={`peg-${p.cx}`} className={styles.inkFill} cx={p.cx} cy={p.cy} r={1.4} />
      ))}
      <g>
        <circle className={styles.mergedOutline} {...LOWER_BOUT} />
        <circle className={styles.mergedOutline} {...UPPER_BOUT} />
        <path className={styles.mergedOutline} d={WAIST} />
        <circle className={styles.whiteFill} {...LOWER_BOUT} />
        <circle className={styles.whiteFill} {...UPPER_BOUT} />
        <path className={styles.whiteFill} d={WAIST} />
      </g>
    </g>
  );
};
