import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { chestPanel } from "../../paths/metalKit/index.js";
import * as styles from "./styles.js";

// battle-vest b (metal Top), ported from the harness's metal-kit.js: the
// hot-rod vest. The ink chest panel battle-vest a cuts its bolt from, with ONE
// big ember flame patch on it instead: three sharp tongues joined by straight
// lines, V notches where the black vest shows between them, solid with
// nothing dark inside so it is a flame and never a face. Its base sits at
// y 55, so about 6 units of black vest show under it, clear of the legs.
// Clipped to the body, as every metal Top is.
const VEST_FLAME =
  "M 57 55 C 52.4 55 50.4 51.8 51 48.6 C 51.4 46.4 52.6 44.8 52.2 41.8 L 55.4 46 L 56.6 38.6 L 60 44.6 L 62.6 41.4 C 63.6 44.6 63.6 47 63.2 49.6 C 62.6 53 60.4 55 57 55 Z";

export const BattleVestB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={context.shapes.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.styleFill[context.style ?? "ink"]} d={chestPanel(context.head.shoulders)} />
        <path className={styles.emberPatch} d={VEST_FLAME} />
      </g>
    </g>
  );
};
