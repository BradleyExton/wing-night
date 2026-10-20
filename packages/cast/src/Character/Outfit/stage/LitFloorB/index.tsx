import * as styles from "./styles.js";

// lit-floor b (disco Stage), ported from the harness's disco-show.js: one big
// lit tile, the bird's own, a thin slab seen from above with a 2-unit ink
// front edge, split into three columns by two rows of panels with the splits
// clear of the legs. Two opposite panels burn white at once and the pair
// chases round all six on the beat, so any still frame shows two of six lit.
// A showpiece: never drawn in a game, whose ground is its own.
//
// The slab is the harness's back 62 / mid 69 / front 76 panels written out,
// in its chase order: back row left to right, then front row right to left.
const SLAB_FRONT = "M 5 76 L 75 76 L 74.4 78 L 5.6 78 Z";

const PANELS = [
  "M 13 62 L 27 62 L 24.5 69 L 9 69 Z",
  "M 27 62 L 53 62 L 55.5 69 L 24.5 69 Z",
  "M 53 62 L 67 62 L 71 69 L 55.5 69 Z",
  "M 55.5 69 L 71 69 L 75 76 L 58 76 Z",
  "M 24.5 69 L 55.5 69 L 58 76 L 22 76 Z",
  "M 9 69 L 24.5 69 L 22 76 L 5 76 Z"
] as const;

// Its one style is `team`, so the drawing reads nothing from its context.
export const LitFloorB = (): JSX.Element => {
  return (
    <g>
      <path className={styles.slabFront} d={SLAB_FRONT} />
      {PANELS.map((d, index) => (
        <path key={d} className={styles.chase[index]} d={d} />
      ))}
    </g>
  );
};
