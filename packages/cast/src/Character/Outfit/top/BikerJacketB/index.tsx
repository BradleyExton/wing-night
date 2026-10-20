import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { belowShoulders } from "../../paths/metalKit/index.js";
import * as styles from "./styles.js";

// biker-jacket b (metal Top), ported from the harness's metal-kit.js: the club
// jacket. The same whole-body ink jacket as a (body minus wing, from the
// shoulders down), closed, crossed by ONE wide ember band 6.8 tall from the
// wing's front edge to the chest's front: the black-and-orange of a biker
// club's leathers. Clipped to the body, as every metal Top is.
//
// The band's left end is the harness's `wingFrontX` at 42.6 and 49.4 (the
// wing's front edge pushed 0.8 forward), written out.
const BAND = "M 49.84 42.6 L 72 42.6 L 72 49.4 L 46.98 49.4 Z";

export const BikerJacketB = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const jacketClipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <defs>
          <clipPath id={jacketClipId}>
            <path d={belowShoulders(context.head.shoulders)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${jacketClipId})`}>
          <path
            className={`${styles.styleFill[context.style ?? "ink"]} ${styles.evenodd}`}
            d={`${context.shapes.body} ${context.shapes.wing}`}
          />
        </g>
        <path className={styles.emberBand} d={BAND} />
      </g>
    </g>
  );
};
