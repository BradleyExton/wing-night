import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// union-jack-dress a (pop Top), ported from the harness's pop-kit.js: a flag
// bodice from y 40 to a waist at y 52, a team waistline, then a plain ink
// skirt that runs back under the wing and flares to the body's front-bottom
// corner, with a white band along its hem so it reads as its own piece.
//
// The harness's `jackDress`: both panels filled inside the body, the band
// kept to the skirt, the jack kept to the bodice, the seam, then the body's
// edge drawn back over both. The jack's lines are `unionJack(56.5, 46, …)`
// written out (angle 46, upward arms stopped at y 38.5 under the neck).
const BODICE = "M 48.5 41 Q 57 39.5 70 40 L 70 52 L 46.4 52 C 49.6 49 50.2 45 48.5 41 Z";

const SKIRT =
  "M 46.4 52 L 72 52 L 72 55.8 L 61.2 55.8 L 44 60 L 26 58.6 L 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51 L 46.4 52 Z";

// The white hem band: the hem line raised 3u, run on past the skirt (it clips).
const HEM_BAND = "M 66 51.5 L 44 57 L 26 55.6 L 18 55 L 18 64 L 66 64 Z";

const SALTIRE =
  "M 49.25733418894694 38.5 L 84.28633481835989 74.77359201354605 M 28.713665181640106 74.77359201354605 L 63.74266581105306 38.5";

const CROSS = "M 56.5 38.5 L 56.5 86 M 16.5 46 L 96.5 46";

const SEAM = "M 44 52 L 72 52";

export const UnionJackDressA = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const bodiceClipId = useId();
  const skirtClipId = useId();
  const dressClipId = useId();
  const style = context.style ?? "ink";
  const base = `${styles.styleFill[style]} ${styles.inkEdge}`;
  const accent = style === "team" ? styles.accentOnTeam : styles.accentOnInk;

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
        <clipPath id={bodiceClipId}>
          <path d={BODICE} />
        </clipPath>
        <clipPath id={skirtClipId}>
          <path d={SKIRT} />
        </clipPath>
        <clipPath id={dressClipId}>
          <path d={`${BODICE} ${SKIRT}`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={base} d={SKIRT} />
        <path className={base} d={BODICE} />
      </g>
      <g clipPath={`url(#${skirtClipId})`}>
        <g clipPath={`url(#${bodyClipId})`}>
          <path className={styles.whiteFill} d={HEM_BAND} />
        </g>
      </g>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={SKIRT} />
      </g>
      <g clipPath={`url(#${bodiceClipId})`}>
        <g clipPath={`url(#${bodyClipId})`}>
          <path className={styles.saltire} d={SALTIRE} />
          <path className={styles.cross} d={CROSS} />
          <path className={accent} d={CROSS} />
        </g>
      </g>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={accent} d={SEAM} />
      </g>
      <g clipPath={`url(#${dressClipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={context.shapes.body} />
      </g>
    </g>
  );
};
