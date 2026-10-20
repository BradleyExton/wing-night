import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { CHEST } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// dagger-collar b (disco Top), ported from the harness's disco-kit.js: the
// Night Fever suit. A light jacket (the style is the jacket's), the black
// shirt open in a narrow V and its collar spread over the lapels as ONE ink
// shape: two separate blades read as a jaw, two light points on ink as fangs.
const FEVER_COLLAR = "M 49.5 37 L 62 37.5 L 59.8 41.5 L 55.5 52 L 51.5 42.5 L 44 48.5 Z";

export const DaggerCollarB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.styleFill[context.style ?? "white"]} d={CHEST} />
        <path className={`${styles.inkFill} ${styles.inkEdgeThin}`} d={FEVER_COLLAR} />
      </g>
    </g>
  );
};
