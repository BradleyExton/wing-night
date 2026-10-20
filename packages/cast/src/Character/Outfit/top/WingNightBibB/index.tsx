import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { paperBib } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// wing-night-bib b (shared Top), ported from the harness's shared.js: the
// takeout joint's paper bib, a white square tied on below the neck with
// straight sides and a square hem, so it reads as a light block where a reads
// dark. The splat sits on a 2.6u ink underlay inside the paper, then the
// paper's own edge and one ink tie string off its top-back corner.
//
// The harness paints the splat in the team colour unless that colour cannot
// show on white paper (contrast under 1.6:1), when it is BBQ sauce, solid ink.
// The cast never knows the team colour (it is currentColor), so the spiky
// body stands in for it: of the eight team colours only chrome is under 1.6,
// and chrome is the metal team, which is the spiky body. A spiky team in
// another colour gets the ink splat too, which still reads; a chrome team on
// another body would get a faint team splat.
export const WingNightBibB = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const paperClipId = useId();
  const { paper, sauce, tie } = paperBib(context.silhouette, context.head.shoulders);
  const sauceFill = context.silhouette === "spiky" ? styles.inkFill : styles.teamFill;

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
        <clipPath id={paperClipId}>
          <path d={paper} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <path className={styles.whiteFill} d={paper} />
        <g clipPath={`url(#${paperClipId})`}>
          {sauce.map((d) => (
            <path key={`ink-${d}`} className={styles.sauceUnderlay} d={d} />
          ))}
          {sauce.map((d) => (
            <path key={`fill-${d}`} className={sauceFill} d={d} />
          ))}
        </g>
        <path className={styles.paperEdge} d={paper} />
        <path className={styles.tie} d={tie} />
      </g>
      <g clipPath={`url(#${paperClipId})`}>
        <path className={context.shapes.mitered ? styles.bodyEdgeMitered : styles.bodyEdge} d={context.shapes.body} />
      </g>
    </g>
  );
};
