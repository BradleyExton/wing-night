import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// flame-sleeve a (metal Sleeve), ported from the harness's metal-kit.js: the
// ink wing on fire. The wing is painted out in the body colour first, so the
// flame's higher trailing edge shows the body and not the old zigzag; then
// one ember flame whose top-back edge is three tongues raking up and back,
// the leather (ink) over its front and bottom, and the outline last. Every
// tongue is light into dark, so no mouth can open.
const FLAME_WING =
  "M 47 35 C 41.87 31.58 35.12 31.41 29.52 33.93 C 30 36.4 29.6 39 30.4 41.6 C 28.4 40 25.4 40.6 22.23 39.8 C 22.8 42 22.6 44 23.6 46.2 C 21 46.9 17 48.8 13.6 50.4 C 16.6 51.2 19.4 52.4 21.8 53.8 C 24 55.6 28 56.4 32 56 C 38 55.6 42 54 45 51 C 49 46 51 40 47 35 Z";

// The leather the fire burns out of, clipped to the flame.
const INK_SHOULDER =
  "M 28 28 L 29.52 33.93 C 33.4 35.4 36.6 37.4 37.4 41.4 C 38 45.6 36.4 51 33.4 57 L 52 57 L 52 28 Z";

export const FlameSleeveA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();

  return (
    <g>
      <path className={styles.eraseWing} d={context.shapes.wing} />
      <defs>
        <clipPath id={clipId}>
          <path d={FLAME_WING} />
        </clipPath>
      </defs>
      <path className={styles.emberFill} d={FLAME_WING} />
      <g clipPath={`url(#${clipId})`}>
        <path className={styles.styleFill[context.style ?? "ink"]} d={INK_SHOULDER} />
      </g>
      <path className={styles.flameOutline} d={FLAME_WING} />
    </g>
  );
};
