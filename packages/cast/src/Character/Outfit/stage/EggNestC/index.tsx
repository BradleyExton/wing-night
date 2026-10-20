import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { GIANT_EGG, PAD, SMALL_EGG, eggPath, goldShine } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// egg-nest c (shared Stage), ported from the harness's shared.js: the big
// one, a scale gag ("she laid THAT?") where a reads as many eggs. One giant
// egg leaning back on the thin ink pad behind the legs, 27 long with its
// narrow end up and back (a stage may not rise above y 55, so it cannot stand
// taller), and one ordinary egg at the front for scale. Gold gives the giant
// the golden egg's shade and glint.
//
// Nothing moves per body; the eggs and the shine are the shared builders,
// run once here.
const GIANT = eggPath(...GIANT_EGG);

const SMALL = eggPath(...SMALL_EGG);

const SHINE = goldShine(GIANT_EGG);

export const EggNestC = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const style = context.style ?? "white";
  const fill = styles.styleFill[style];

  return (
    <g>
      <path className={styles.pad} d={PAD} />
      <path className={styles.eggOutline} d={GIANT} />
      <path className={fill} d={GIANT} />
      {style === "gold" && (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={SHINE.egg} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <path className={styles.shade} d={SHINE.shade} />
            <path className={styles.glint} d={SHINE.glint} />
          </g>
        </>
      )}
      <path className={styles.eggOutline} d={SMALL} />
      <path className={fill} d={SMALL} />
    </g>
  );
};
