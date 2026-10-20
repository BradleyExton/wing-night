import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { knottedSash } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// team-sash b (shared Top), ported from the harness's shared.js: the knotted
// sash, a's whole shoulder-to-hip band with a 9 x 13 knot tied on it toward
// the back hip and broad 8u ribbon tails with V notches swung back over the
// band, never right of x 29.5 below y 55, so the near leg stays orange. The
// broody wears two tails, the stock and the spiky one, the preener (whose
// chest is too shallow for a tail to clear the band) the knot alone.
//
// Shared, so it is placed per body (`knottedSash` reads the silhouette),
// clipped to the chest, with the body's outline restroked over the band, the
// tails and the knot together.
export const TeamSashB = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const sashClipId = useId();
  const { band, tails, knot, all, cinch } = knottedSash(context.silhouette, context.head.shoulders);
  const style = context.style ?? "white";
  const fill = styles.styleFill[style];

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
        <clipPath id={sashClipId}>
          <path d={all} />
        </clipPath>
      </defs>
      {style === "white" ? (
        <g clipPath={`url(#${bodyClipId})`}>
          <path className={styles.sharedEdge} d={band} />
          <path className={styles.sharedEdge} d={knot} />
          <path className={fill} d={band} />
          {tails.map((d) => (
            <path key={d} className={styles.whiteTail} d={d} />
          ))}
          <path className={fill} d={knot} />
        </g>
      ) : (
        <g clipPath={`url(#${bodyClipId})`}>
          <path className={fill} d={band} />
          {tails.map((d) => (
            <path key={d} className={styles.inkTail} d={d} />
          ))}
          <path className={fill} d={knot} />
          <path className={styles.cinch} d={cinch} />
        </g>
      )}
      <g clipPath={`url(#${sashClipId})`}>
        <path className={context.shapes.mitered ? styles.bodyEdgeMitered : styles.bodyEdge} d={context.shapes.body} />
      </g>
    </g>
  );
};
