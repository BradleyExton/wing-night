import type { OutfitItemProps } from "../../context/index.js";
import { NEST_CURL, NEST_EGGS, NEST_WALL, PAD, eggPath } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// egg-nest b (shared Stage), ported from the harness's shared.js: one straw
// nest beside her at the tail end, a lumpy ember wall with one straw curl up
// and back, and three eggs of three sizes standing up out of it, each with its
// own outline so they overlap as a clutch (a same-size pair over a wall read
// as eyes). It stops at x 22, short of the near foot; under the feet is the
// clutch's thin ink pad. The style paints the eggs.
//
// The eggs do not move per body; they are `eggPath`, the same builder the
// golden egg uses, run once here.
const EGGS = NEST_EGGS.map((egg) => eggPath(...egg));

const STRAW = [NEST_WALL, NEST_CURL];

export const EggNestB = ({ context }: OutfitItemProps): JSX.Element => {
  const fill = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={styles.pad} d={PAD} />
      {EGGS.map((d) => [
        <path key={`outline-${d}`} className={styles.eggOutline} d={d} />,
        <path key={`fill-${d}`} className={fill} d={d} />
      ])}
      {STRAW.map((d) => (
        <path key={`outline-${d}`} className={styles.strawOutline} d={d} />
      ))}
      {STRAW.map((d) => (
        <path key={`fill-${d}`} className={styles.emberFill} d={d} />
      ))}
    </g>
  );
};
