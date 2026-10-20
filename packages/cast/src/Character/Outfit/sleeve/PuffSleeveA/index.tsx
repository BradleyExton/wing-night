import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// puff-sleeve a (pop Sleeve), ported from the harness's pop-kit.js: the
// ruffle cuff. A white frill of three big overlapped lobes over a strip
// tucked under the wing hangs below the arm, inked only round its outside
// (the harness's `silhouettes`); then the wing is redrawn over it in the team
// colour with its scalloped trailing edge smoothed into one cuff line, and an
// ink line 3u inside that cuff makes a team band the frill hangs from.
//
// Every shape is a literal on the stock wing: the cuff wing is the stock
// wing's own outline with the scallops replaced, not the wearer's wing.
const FRILL = [
  "M 24 47 L 46 46 L 46 50 L 25 53 Z",
  "M 33.5 54.2 A 4.5 6 0 1 1 24.5 54.2 A 4.5 6 0 1 1 33.5 54.2 Z",
  "M 40.5 53.3 A 4.5 6 0 1 1 31.5 53.3 A 4.5 6 0 1 1 40.5 53.3 Z",
  "M 47.5 51.3 A 4.5 6 0 1 1 38.5 51.3 A 4.5 6 0 1 1 47.5 51.3 Z"
];

const CUFF_WING =
  "M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 C 31 54.6 39 53.4 45 51 C 49 46 51 40 47 35 Z";

const CUFF_LINE = "M 20.6 49.6 C 21.8 51.2 23.2 52 25 52 C 31.5 51.6 38.5 50.6 45.6 47.6";

export const PuffSleeveA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const frill = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      {FRILL.map((d) => (
        <path key={`edge-${d}`} className={styles.frillEdge} d={d} />
      ))}
      {FRILL.map((d) => (
        <path key={`fill-${d}`} className={frill} d={d} />
      ))}
      <path className={`${styles.teamFill} ${styles.inkEdge}`} d={CUFF_WING} />
      <defs>
        <clipPath id={clipId}>
          <path d={CUFF_WING} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={`${styles.unfilled} ${styles.inkEdge}`} d={CUFF_LINE} />
      </g>
    </g>
  );
};
