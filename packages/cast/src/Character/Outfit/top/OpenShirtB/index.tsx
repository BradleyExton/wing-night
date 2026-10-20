import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { CHEST } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// open-shirt b (disco Top), ported from the harness's disco-kit.js: the
// medallion. An ink shirt open to the navel in a deep team-colour V, its apex
// below the belly outline, and a big solid ember medallion hung on a heavy
// chain in the V, wholly on the bare chest so it is a pendant and never a
// button. Every ember line is cased in ink so it reads on the team colour; the
// disc is solid, no ring and no dark centre.
const OPEN_V = "M 45 37 L 68 37 L 57.5 57 Z";

const CHAIN = "M 51 38.6 L 56.8 41.2 L 61.8 38";

export const OpenShirtB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.styleFill[context.style ?? "ink"]} d={CHEST} />
        <path className={styles.opening} d={OPEN_V} />
        <path className={styles.chainCasing} d={CHAIN} />
        <path className={styles.chain} d={CHAIN} />
        <circle className={styles.medallion} cx={56.8} cy={45} r={4.6} />
      </g>
    </g>
  );
};
