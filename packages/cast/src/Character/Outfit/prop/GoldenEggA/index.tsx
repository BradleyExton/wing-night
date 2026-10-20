import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { clutchedEgg, eggPath, goldShine } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// golden-egg a (shared Prop), ported from the harness's shared.js: a big egg
// (10.5 x 13.5) clutched under the wing, leaning back, its bottom poking below
// the belly, placed per body (`clutchedEgg` reads the silhouette) so at least
// 3u of team colour shows between it and a white sash band. White with the
// house outline by default; gold adds a shade crescent and a curved glint,
// clipped to the egg, so it reads as metal and not mustard.
export const GoldenEggA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const style = context.style ?? "white";
  const egg = clutchedEgg(context.silhouette);
  const d = eggPath(...egg);
  const shine = style === "gold" ? goldShine(egg) : undefined;

  return (
    <g>
      <path className={styles.eggOutline} d={d} />
      <path className={styles.styleFill[style]} d={d} />
      {shine !== undefined && (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={shine.egg} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <path className={styles.shade} d={shine.shade} />
            <path className={styles.glint} d={shine.glint} />
          </g>
        </>
      )}
    </g>
  );
};
