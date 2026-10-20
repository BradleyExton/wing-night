import type { OutfitItemProps } from "../../context/index.js";
import { CLUTCH_BACK, CLUTCH_FRONT, PAD, eggPath } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// egg-nest a (shared Stage), ported from the harness's shared.js: the
// clutch. No bowl, just a heap of eggs on a thin ink pad, three behind her
// and two in front, overlapping, so the read from the TV is simply eggs.
// Under the feet the pad is ink, a ground shadow the orange legs cross
// cleanly. The style paints the eggs: white, or a gold clutch. Each heap
// shares one merged outline.
//
// The eggs do not move per body; they are `eggPath`, the same builder the
// golden egg uses, run once here.
const HEAPS = [CLUTCH_BACK, CLUTCH_FRONT].map((heap) => heap.map((egg) => eggPath(...egg)));

export const EggNestA = ({ context }: OutfitItemProps): JSX.Element => {
  const fill = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={styles.pad} d={PAD} />
      {HEAPS.map((heap) => [
        ...heap.map((d) => <path key={`outline-${d}`} className={styles.eggOutline} d={d} />),
        ...heap.map((d) => <path key={`fill-${d}`} className={fill} d={d} />)
      ])}
    </g>
  );
};
