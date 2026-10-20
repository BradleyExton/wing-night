import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { lobsterBib } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// wing-night-bib a (shared Top), ported from the harness's shared.js: the
// lobster bib, a U-shaped ink panel from under the neck to the belly with one
// splat of sauce in the wearer's own colour thrown off-centre, a tailed
// droplet and a drip. Every sauce part has a 1.2u ember rim, so the splat sits
// ON the bib instead of reading as a hole through it to the same-colour body.
//
// Shared, so it is placed per body (`lobsterBib` reads the silhouette), drawn
// generously and clipped to the chest; the body's outline is then restroked
// over it, clipped to the bib, so the clip never eats the edge.
export const WingNightBibA = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const bibClipId = useId();
  const { bib, sauce } = lobsterBib(context.silhouette, context.head.shoulders);

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
        <clipPath id={bibClipId}>
          <path d={bib} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={styles.inkFill} d={bib} />
        {sauce.map((d) => (
          <path key={`rim-${d}`} className={styles.sauceRim} d={d} />
        ))}
        {sauce.map((d) => (
          <path key={`fill-${d}`} className={styles.teamFill} d={d} />
        ))}
      </g>
      <g clipPath={`url(#${bibClipId})`}>
        <path className={context.shapes.mitered ? styles.bodyEdgeMitered : styles.bodyEdge} d={context.shapes.body} />
      </g>
    </g>
  );
};
