import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { TRACK_TOP_PANEL } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// tracksuit-top a (pop Top), ported from the harness's pop-kit.js: a
// full-length track top, back under the wing, hemmed level at y 56. Two
// straight white bars run down the chest on one forward slant with a zip line
// behind them on a steeper one; nothing curves, so it never reads as a rib
// cage. The bars run on below the hem and the hem band squares them off.
const ZIP = "M 48 38 L 52.4 58";

const BARS = ["M 51 39 L 57.7 58", "M 55.5 39 L 62.2 58"];

const HEM_BAND = "M 28 56 L 74 56 L 74 61 L 28 61 Z";

const HEM_LINE = "M 28 56 L 74 56";

export const TracksuitTopA = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const panelClipId = useId();
  const style = context.style ?? "ink";
  const base = styles.styleFill[style];
  const onInk = style === "ink";

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
        <path className={`${base} ${styles.inkEdge}`} d={TRACK_TOP_PANEL} />
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <g clipPath={`url(#${bodyClipId})`}>
          <path className={onInk ? styles.zipOnInk : styles.zipOnWhite} d={ZIP} />
          {BARS.map((d) => (
            <path key={d} className={onInk ? styles.barOnInk : styles.barOnWhite} d={d} />
          ))}
          <path className={base} d={HEM_BAND} />
          <path className={`${styles.unfilled} ${styles.inkEdge}`} d={HEM_LINE} />
        </g>
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
    </g>
  );
};
