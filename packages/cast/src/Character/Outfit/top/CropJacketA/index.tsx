import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// crop-jacket a (pop Top), ported from the harness's pop-kit.js: an open
// white bomber cropped at mid-chest. Its front edge stops 5u inside the
// body's outline all the way down, so a strip of the bird's own colour shows
// between jacket and outline, and the rib hem stops at that opening too.
//
// The harness's `garment`: the panel clipped to the body, the rib kept to
// panel and body, then the body's own ink edge drawn back over the panel.
const PANEL = "M 44 37 L 57.6 37 C 59.4 40.5 59.6 47 56.6 54 L 43.6 53.6 C 41 47 41.5 41 44 37 Z";

const RIB = "M 38 50 L 74 50 L 74 58 L 38 58 Z";

export const CropJacketA = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const panelClipId = useId();
  const style = context.style ?? "white";

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
        <clipPath id={panelClipId}>
          <path d={PANEL} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={PANEL} />
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <g clipPath={`url(#${bodyClipId})`}>
          {/* the rib in the colour that reads on the jacket, so it is always a hem */}
          <path className={style === "ink" ? styles.whiteFill : styles.inkFill} d={RIB} />
        </g>
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
    </g>
  );
};
