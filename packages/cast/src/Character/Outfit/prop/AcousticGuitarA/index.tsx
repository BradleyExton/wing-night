import * as styles from "./styles.js";

// acoustic-guitar a (country Prop), ported from the harness's country-show.js:
// the strummer. In playing position across the belly, a big body forward and
// low and the neck rising up and back over the thigh to a pegged headstock at
// the bird's back edge: the rising diagonal neck is what makes it a guitar (a
// level neck read as a bone). No sound hole and no bridge, since any mark
// inside the body is an eye or a mouth at 76px. White only: an ink body lands
// on the wing's lower outline and the waist vanishes.
//
// The shapes are the harness's `neckAndHead((38.6,54.4), (24,47))` and
// `guitarBody` (bouts 8.5 at (50,60.5) and 5.6 at (41.6,56), waist 0.5)
// written out: an ink casing pass under each white part, so the neck shows on
// the orange and on the dark hearth.
const NECK = "M 38.6 54.4 L 23.55 46.77";

const HEADSTOCK = "M 25.27 44.5 L 20.14 41.34 L 17.16 47.23 L 22.73 49.5 Z";

// The tuning peg nubs either side of the headstock.
const PEGS = [{ cx: 22.77, cy: 42.12 }, { cx: 19.34, cy: 48.9 }];

// The figure-eight body: lower bout, upper bout and the waist between them.
const LOWER_BOUT = { cx: 50, cy: 60.5, r: 8.5 };

const UPPER_BOUT = { cx: 41.6, cy: 56, r: 5.6 };

const WAIST = "M 40.28 58.47 L 47.99 64.25 L 52.01 56.75 L 42.92 53.53 Z";

// Its one style is `white`, so the drawing reads nothing from its context.
export const AcousticGuitarA = (): JSX.Element => {
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
