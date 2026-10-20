import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { belowShoulders } from "../../paths/metalKit/index.js";
import * as styles from "./styles.js";

// biker-jacket a (metal Top), ported from the harness's metal-kit.js: the
// Perfecto. The jacket is a VALUE change of the whole visible body: body
// minus wing (evenodd) goes ink from the shoulders down, so the bird is black
// with the wing, or whatever sleeve is worn, left silver as the arm. A 3-unit
// chrome zip runs from under the collar to the hem and ONE chrome lapel point
// folds back from the collar. Clipped to the body, as every metal Top is.
const ZIP = "M 61.4 39.6 L 51.8 57.4";

const LAPEL = "M 53.6 37.6 L 64.4 38.6 L 59.6 46.4 L 62.4 51.6 L 54.6 50.2 Z";

export const BikerJacketA = ({ context }: OutfitItemProps): JSX.Element => {
  const bodyClipId = useId();
  const jacketClipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={bodyClipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClipId})`}>
        <defs>
          <clipPath id={jacketClipId}>
            <path d={belowShoulders(context.head.shoulders)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${jacketClipId})`}>
          <path
            className={`${styles.styleFill[context.style ?? "ink"]} ${styles.evenodd}`}
            d={`${context.shapes.body} ${context.shapes.wing}`}
          />
        </g>
        <path className={styles.zip} d={ZIP} />
        <path className={styles.lapel} d={LAPEL} />
      </g>
    </g>
  );
};
