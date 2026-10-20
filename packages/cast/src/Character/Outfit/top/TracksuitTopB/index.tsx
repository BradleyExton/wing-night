import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { TRACK_TOP_PANEL } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// tracksuit-top b (pop Top), ported from the harness's pop-kit.js: the shell
// suit, a's track top colour-blocked the nineties way on one steep diagonal:
// a white yoke over the chest, a 6u team band falling from under the wing to
// the front edge with both edges inked, and the ink body under it. The
// band's edges run on past the panel at both ends; the panel clips them.
const YOKE = "M 40 37 L 77 37 L 77 53.6 L 71 51 C 60 46.5 53 44 46 45 L 40 45.5 Z";

const BAND =
  "M 40 45.5 L 46 45 C 53 44 60 46.5 71 51 L 77 53.6 L 77 59.6 L 71 57 C 60 52.5 53 50 46 51 L 40 51.5 Z";

const BAND_EDGES =
  "M 40 45.5 L 46 45 C 53 44 60 46.5 71 51 L 77 53.6 M 40 51.5 L 46 51 C 53 50 60 52.5 71 57 L 77 59.6";

export const TracksuitTopB = ({ context }: OutfitItemProps): JSX.Element => {
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
          <path d={TRACK_TOP_PANEL} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={TRACK_TOP_PANEL} />
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <g clipPath={`url(#${bodyClipId})`}>
          <path className={style === "ink" ? styles.whiteFill : styles.inkFill} d={YOKE} />
          <path className={styles.teamFill} d={BAND} />
          <path className={`${styles.unfilled} ${styles.inkEdge}`} d={BAND_EDGES} />
        </g>
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
    </g>
  );
};
