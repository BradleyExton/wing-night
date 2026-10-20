import type { OutfitItemProps } from "../../context/index.js";
import { BELL, BELL_CUFF, BELL_HEM } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// flare-sleeve c (disco Sleeve), ported from the harness's disco-kit.js: the
// white flare. The whole sleeve in the style's satin, flaring at its back end
// into b's wide trumpet, a broad ink cuff band round the joint and the hem
// line in its mouth. b is a black sleeve with a white bell; c is one light
// flared sleeve banded in black, so the flare reads by silhouette either way.
export const FlareSleeveC = ({ context }: OutfitItemProps): JSX.Element => {
  const satin = `${styles.styleFill[context.style ?? "white"]} ${styles.inkEdge}`;

  return (
    <g>
      <path className={satin} d={context.shapes.wing} />
      <path className={satin} d={BELL} />
      <path className={styles.cuff} d={BELL_CUFF} />
      <path className={styles.hem} d={BELL_HEM} />
    </g>
  );
};
