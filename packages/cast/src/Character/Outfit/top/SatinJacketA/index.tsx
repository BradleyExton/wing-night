import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { CHEST } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// satin-jacket a (disco Top), ported from the harness's disco-kit.js: the rink
// patch. A closed ink jacket zipped up the front (a white zip cased in ink, a
// closed line and never the open shirt's V), a team rib collar that reads as
// a band at the throat, and one big tilted team star patch set back on the
// breast. The star stays team in every style (an ink star on white is a
// splat); in the white style the rib and the zip turn ink.
//
// The harness clips the zip, rib and star to the visible chest and inside
// that to the body again (`onChest`), all within the chest ground's own body
// clip; the three clips are kept so the shapes match.
const RIB = "M 46 37 L 55.43 37 L 62.5 40.3 L 62.5 47.8 L 46 40.1 Z";

const ZIP = "M 57 40.5 L 55.5 58";

// The harness's `star(40, 49.5, 7.5, 5, 0.42, 12)`.
const STAR =
  "M 41.56 42.16 L 42.34 47.39 L 47.46 48.72 L 42.73 51.08 L 43.05 56.35 L 39.35 52.58 L 34.43 54.52 L 36.87 49.83 L 33.50 45.75 L 38.72 46.62 Z";

export const SatinJacketA = ({ context }: OutfitItemProps): JSX.Element => {
  const groundClipId = useId();
  const chestClipId = useId();
  const bodyClipId = useId();
  const style = context.style ?? "ink";
  const white = style === "white";

  return (
    <g>
      <defs>
        <clipPath id={groundClipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${groundClipId})`}>
        <path className={styles.styleFill[style]} d={CHEST} />
        <defs>
          <clipPath id={chestClipId}>
            <path d={CHEST} />
          </clipPath>
          <clipPath id={bodyClipId}>
            <path d={context.shapes.body} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${chestClipId})`}>
          <g clipPath={`url(#${bodyClipId})`}>
            {white ? (
              <path className={styles.inkZip} d={ZIP} />
            ) : (
              <>
                <path className={styles.zipCasing} d={ZIP} />
                <path className={styles.zip} d={ZIP} />
              </>
            )}
            <path className={white ? styles.inkRib : styles.teamRib} d={RIB} />
            <path className={styles.starPatch} d={STAR} />
          </g>
        </g>
      </g>
    </g>
  );
};
