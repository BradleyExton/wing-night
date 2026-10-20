import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// union-jack-dress b (pop Top), ported from the harness's pop-kit.js: the
// flag tube dress, one piece with no waist seam, from a neckline at y 40 to a
// straight hem at y ≈58, the jack centred low at the hip so the saltire's
// long lower arms run down the whole dress. In the team style the field is
// the team colour and the accent turns ink.
//
// The jack's lines are the harness's `unionJack(55.5, 50, …)` written out
// (angle 42, upward arms stopped at y 39 under the neck).
const PANEL =
  "M 48.5 40.5 Q 57 39 70 39.5 L 72 57 C 60 58.5 50 58.8 44 57.6 L 46.5 52 C 50.5 48 50.5 45 48.5 40.5 Z";

const SALTIRE =
  "M 43.28326233687888 39 L 85.22579301909576 76.76522425435434 M 25.774206980904232 76.76522425435434 L 67.71673766312112 39";

const CROSS = "M 55.5 39 L 55.5 90 M 15.5 50 L 95.5 50";

export const UnionJackDressB = ({ context }: OutfitItemProps): JSX.Element => {
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
          <path className={styles.saltire} d={SALTIRE} />
          <path className={styles.cross} d={CROSS} />
          <path className={style === "team" ? styles.accentOnTeam : styles.accentOnInk} d={CROSS} />
        </g>
      </g>
      <g clipPath={`url(#${panelClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
    </g>
  );
};
