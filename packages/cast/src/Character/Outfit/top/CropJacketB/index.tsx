import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// crop-jacket b (pop Top), ported from the harness's pop-kit.js: the star
// bomber, an ink crop closed at the throat with a white rib hem, so the crop
// line shows against the belly, and one big team star on the chest where a
// letterman puts its patch, clear of the rib.
//
// The panel is the harness's `JACKET(56)`, over the front third of the wing
// to a hem across the chest; the star is `starPath(55.6, 44.5, 7)`.
const PANEL = "M 44 37 C 41.5 41 41 47 43.5 55.5 L 70 57 L 70 37 Z";

const RIB = "M 38 51.4 L 74 52.6 L 74 60 L 38 60 Z";

const STAR =
  "M 55.60 37.50 L 57.45 41.95 L 62.26 42.34 L 58.60 45.47 L 59.71 50.16 L 55.60 47.65 L 51.49 50.16 L 52.60 45.47 L 48.94 42.34 L 53.75 41.95 Z";

export const CropJacketB = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const panelClipId = useId();
  const style = context.style ?? "ink";

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
          <path className={`${style === "ink" ? styles.whiteFill : styles.inkFill} ${styles.inkEdge}`} d={RIB} />
          <path className={`${styles.teamFill} ${styles.inkEdge}`} d={STAR} />
        </g>
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
    </g>
  );
};
