import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { sashBand } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// team-sash a (shared Top), ported from the harness's shared.js: a pageant
// sash, one flat 8.4u band from the near shoulder (tucked under the neck)
// across the wing to the back hip, no trim or lettering: at 76px it is a
// diagonal value stroke or nothing. It is cut flat at y 36.5 (or the
// shoulders, if lower), where the neck covers the cut on every head.
//
// Shared, so the line is per body (`sashBand` reads the silhouette), clipped
// to the chest, with the body's outline restroked over it.
export const TeamSashA = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const bandClipId = useId();
  const band = sashBand(context.silhouette, context.head.shoulders);
  const style = context.style ?? "white";

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
        <clipPath id={bandClipId}>
          <path d={band} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={style === "white" ? styles.whiteBand : styles.styleFill[style]} d={band} />
      </g>
      <g clipPath={`url(#${bandClipId})`}>
        <path className={context.shapes.mitered ? styles.bodyEdgeMitered : styles.bodyEdge} d={context.shapes.body} />
      </g>
    </g>
  );
};
